/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import { PortfolioService } from "../services/PortfolioService";
import { AssetService } from "../services/AssetService";
import { SignalRService } from "../services/SignalRService";
import type { PortfolioResponse } from "../types/Portfolio/PortfolioResponse";
import type { BISTStockResponse } from "../types/BISTStock/BISTStockResponse";
import type { CryptoAssetResponse } from "../types/CryptoAsset/CryptoAssetResponse";
import "../styles/PortfolioPage.css";
import { useAuth } from "../context/AuthProvider";

interface AddAssetModal {
  isOpen: boolean;
  portfolioId: number | null;
  portfolioType: string;
}

const PortfolioPage: React.FC = () => {
  const { id: userId, logout } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // SignalRService instance'ı tek bir yerde tut
  const [signalRService] = useState(() => SignalRService.getInstance());

  // Modal states
  const [addAssetModal, setAddAssetModal] = useState<AddAssetModal>({
    isOpen: false,
    portfolioId: null,
    portfolioType: "",
  });

  // Asset search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    (BISTStockResponse | CryptoAssetResponse)[]
  >([]);
  const [selectedAsset, setSelectedAsset] = useState<
    BISTStockResponse | CryptoAssetResponse | null
  >(null);
  const [assetPrice, setAssetPrice] = useState<string>("");

  // Form data
  const [formData, setFormData] = useState({
    quantity: "",
    buyPrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  // Portfolio update handler (memoize edildi)
  const handlePortfolioUpdate = useCallback((updatedPortfolios: any) => {
    console.log("Received portfolio update:", updatedPortfolios);
    if (updatedPortfolios.success && updatedPortfolios.data) {
      setPortfolios(updatedPortfolios.data);
    }
  }, []); // Bağımlılık yok, sadece fonksiyonun kendisi

  // SADECE SignalR handler'larını kurma/temizleme useEffect'i
  useEffect(() => {
    // Bağlantının AuthProvider'da kurulduğu varsayılır.
    // Burada sadece handler'ı ekleyip kaldırırız.

    // Handler'ı kaydet
    signalRService.onPortfolioUpdated(handlePortfolioUpdate);

    // Temizleme fonksiyonu: Bileşen kaldırıldığında handler'ı temizle
    return () => {
      signalRService.offPortfolioUpdated(handlePortfolioUpdate);
    };
    // Sadece signalRService ve callback değiştiğinde (ki değişmez) çalışır.
  }, [signalRService, handlePortfolioUpdate]);

  // Load portfolios (İlk yükleme ve diğer servis çağrıları)
  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const response = await PortfolioService.getAllPortfolioAsync();
      setPortfolios(response.data);
    } catch (error: any) {
      setError(error.message);
      if (error.message.includes("Unauthorized")) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadPortfolios();
    }
  }, [userId]); // Sadece userId değiştiğinde çalışır

  // Diğer tüm fonksiyonlar aynı kalır (createPortfolio, deletePortfolio, searchAssets, vb.)
  // ...

  // Create portfolio
  const createPortfolio = async (type: "stock" | "crypto") => {
    try {
      await PortfolioService.createPortfolioAsync(type);
      // SignalR will handle the update
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Delete portfolio
  const deletePortfolio = async (portfolioId: number) => {
    if (!confirm("Bu portföyü silmek istediğinizden emin misiniz?")) return;

    try {
      await PortfolioService.deletePortfolioAsync(portfolioId);
      // SignalR will handle the update
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Search assets
  const searchAssets = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      let results: (BISTStockResponse | CryptoAssetResponse)[] = [];

      if (addAssetModal.portfolioType === "stock") {
        const stockResponse = await AssetService.searchBISTStockSymbolAsync(
          searchTerm
        );
        if (stockResponse.data && stockResponse.data.length > 0) {
          results = stockResponse.data;
        }
      } else if (addAssetModal.portfolioType === "crypto") {
        const cryptoResponse = await AssetService.searchCryptoAssetSymbolAsync(
          searchTerm
        );
        if (cryptoResponse.data && cryptoResponse.data.length > 0) {
          results = cryptoResponse.data;
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Asset search failed:", error);
      setSearchResults([]);
    }
  };

  // Get asset price
  const getAssetPrice = async (symbol: string, type: string) => {
    try {
      const response = await AssetService.getPriceAsync(symbol, type);
      setAssetPrice(response.data);
    } catch (error) {
      console.error("Price fetch failed:", error);
      setAssetPrice("N/A");
    }
  };

  // Select asset
  const selectAsset = (asset: BISTStockResponse | CryptoAssetResponse) => {
    setSelectedAsset(asset);
    getAssetPrice(asset.symbol, addAssetModal.portfolioType);
  };

  // Add asset to portfolio
  const addAssetToPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAsset || !addAssetModal.portfolioId) return;

    try {
      await PortfolioService.addAssetToPortfolioAsync({
        portfolioId: addAssetModal.portfolioId,
        symbol: selectedAsset.symbol,
        quantity: parseFloat(formData.quantity),
        buyPrice: parseFloat(formData.buyPrice),
        purchaseDate: new Date(formData.purchaseDate),
      });

      // Reset modal
      setAddAssetModal({ isOpen: false, portfolioId: null, portfolioType: "" });
      setSelectedAsset(null);
      setSearchTerm("");
      setSearchResults([]);
      setAssetPrice("");
      setFormData({
        quantity: "",
        buyPrice: "",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Delete portfolio item
  const deletePortfolioItem = async (itemId: number) => {
    if (
      !confirm("Bu varlığı portföyden kaldırmak istediğinizden emin misiniz?")
    )
      return;

    try {
      await PortfolioService.deletePortfolioItemAsync(itemId);
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="portfolio-loading">
        <div className="loading-spinner"></div>
        <p>Portföyler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <h1>Portföy Yönetimi</h1>
        <div className="portfolio-actions">
          <button
            className="create-btn stock-btn"
            onClick={() => createPortfolio("stock")}
          >
            Hisse Portföyü Oluştur
          </button>
          <button
            className="create-btn crypto-btn"
            onClick={() => createPortfolio("crypto")}
          >
            Kripto Portföyü Oluştur
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="portfolios-grid">
        {portfolios.map((portfolio) => (
          <div
            key={portfolio.id}
            className={`portfolio-card ${portfolio.type}`}
          >
            <div className="portfolio-card-header">
              <div className="portfolio-type">
                <span className={`type-badge ${portfolio.type}`}>
                  {portfolio.type === "stock" ? "HISSE" : "KRİPTO"}
                </span>
              </div>
              <button
                className="delete-portfolio-btn"
                onClick={() => deletePortfolio(portfolio.id)}
                title="Portföyü Sil"
              >
                ×
              </button>
            </div>

            <div className="portfolio-stats">
              <div className="stat">
                <label>Toplam Değer</label>
                <span className="value">
                  ₺
                  {portfolio.totalValue.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="stat">
                <label>Toplam Yatırım</label>
                <span className="value">
                  ₺
                  {portfolio.totalInvestment.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="stat">
                <label>Kar/Zarar</label>
                <span
                  className={`value ${
                    portfolio.totalProfit >= 0 ? "profit" : "loss"
                  }`}
                >
                  ₺
                  {portfolio.totalProfit.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}
                  ({portfolio.profitPercentage.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="portfolio-items">
              <div className="items-header">
                <h3>Varlıklar ({portfolio.items.length})</h3>
                <button
                  className="add-asset-btn"
                  onClick={() =>
                    setAddAssetModal({
                      isOpen: true,
                      portfolioId: portfolio.id,
                      portfolioType: portfolio.type,
                    })
                  }
                >
                  + Varlık Ekle
                </button>
              </div>

              {portfolio.items.length === 0 ? (
                <p className="no-items">Henüz varlık eklenmemiş</p>
              ) : (
                <div className="items-list">
                  {portfolio.items.map((item) => (
                    <div key={item.id} className="portfolio-item">
                      <div className="item-info">
                        <span className="symbol">{item.symbol}</span>
                        <span className="quantity">
                          {item.quantity.toLocaleString("tr-TR")} adet
                        </span>
                      </div>
                      <div className="item-prices">
                        <span className="buy-price">
                          Alış: ₺
                          {item.buyPrice.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <span className="current-price">
                          Güncel: ₺
                          {item.currentPrice.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="item-profit">
                        <span
                          className={`profit ${
                            item.profit >= 0 ? "positive" : "negative"
                          }`}
                        >
                          ₺
                          {item.profit.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}
                          ({item.profitPercentage.toFixed(2)}%)
                        </span>
                        <button
                          className="delete-item-btn"
                          onClick={() => deletePortfolioItem(item.id)}
                          title="Varlığı Sil"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {portfolios.length === 0 && (
        <div className="no-portfolios">
          <h2>Henüz portföyünüz bulunmuyor</h2>
          <p>Yatırımlarınızı takip etmek için bir portföy oluşturun</p>
        </div>
      )}

      {/* Add Asset Modal */}
      {addAssetModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Varlık Ekle</h2>
              <button
                className="close-modal"
                onClick={() => {
                  setAddAssetModal({
                    isOpen: false,
                    portfolioId: null,
                    portfolioType: "",
                  });
                  setSelectedAsset(null);
                  setSearchTerm("");
                  setSearchResults([]);
                  setAssetPrice("");
                  setFormData({
                    quantity: "",
                    buyPrice: "",
                    purchaseDate: new Date().toISOString().split("T")[0],
                  });
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              {!selectedAsset ? (
                <div className="asset-search">
                  <div className="search-input">
                    <input
                      type="text"
                      placeholder={`${
                        addAssetModal.portfolioType === "stock"
                          ? "Hisse"
                          : "Kripto"
                      } sembolü ara...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && searchAssets()}
                    />
                    <button onClick={searchAssets}>Ara</button>
                  </div>

                  <div className="search-results">
                    {searchResults.map((asset) => (
                      <div
                        key={asset.id}
                        className="search-result-item"
                        onClick={() => selectAsset(asset)}
                      >
                        <div className="asset-info">
                          <span className="symbol">{asset.symbol}</span>
                          {"name" in asset && (
                            <span className="name">{asset.name}</span>
                          )}
                          {"displaySymbol" in asset && (
                            <span className="display">
                              {asset.displaySymbol}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={addAssetToPortfolio} className="add-asset-form">
                  <div className="selected-asset">
                    <h3>Seçili Varlık: {selectedAsset.symbol}</h3>
                    {assetPrice && <p>Güncel Fiyat: ₺{assetPrice}</p>}
                  </div>

                  <div className="form-group">
                    <label>Miktar</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Alış Fiyatı (₺)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.buyPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, buyPrice: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Alış Tarihi</label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchaseDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setSelectedAsset(null)}
                      className="back-btn"
                    >
                      Geri
                    </button>
                    <button type="submit" className="submit-btn">
                      Ekle
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
