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

// Chart bileşenleri
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AddAssetModal {
  isOpen: boolean;
  portfolioId: number | null;
  portfolioType: string;
}

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: "stock" | "crypto";
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const PortfolioPage: React.FC = () => {
  const { id: userId, logout } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "market">(
    "overview"
  );
  const [marketData, setMarketData] = useState<MarketData[]>([]);

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

  // Portfolio update handler - TÜM güncellemeler buradan gelecek
  const handlePortfolioUpdate = useCallback((updatedData: any) => {
    console.log("Received portfolio update:", updatedData);

    // Portfolio güncellemesi
    if (
      updatedData.success &&
      updatedData.data &&
      Array.isArray(updatedData.data)
    ) {
      setPortfolios(updatedData.data);
      updateMarketData(updatedData.data);
    }

    // Market data güncellemesi (eğer farklı bir formatla gelirse)
    else if (updatedData.success && updatedData.marketData) {
      setMarketData(updatedData.marketData);
    }

    // Sadece fiyat güncellemesi
    else if (updatedData.type === "priceUpdate" && updatedData.prices) {
      updatePrices(updatedData.prices);
    }
  }, []);

  // SignalR handler
  useEffect(() => {
    signalRService.onPortfolioUpdated(handlePortfolioUpdate);

    return () => {
      signalRService.offPortfolioUpdated(handlePortfolioUpdate);
    };
  }, [signalRService, handlePortfolioUpdate]);

  // Load portfolios
  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const response = await PortfolioService.getAllPortfolioAsync();
      setPortfolios(response.data);
      updateMarketData(response.data);
    } catch (error: any) {
      setError(error.message);
      if (error.message.includes("Unauthorized")) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Update market data from portfolios
  const updateMarketData = (portfolioData: PortfolioResponse[]) => {
    const marketItems: MarketData[] = [];

    portfolioData.forEach((portfolio) => {
      portfolio.items.forEach((item) => {
        marketItems.push({
          symbol: item.symbol,
          name: item.symbol,
          price: item.currentPrice,
          change: item.profit,
          changePercent: item.profitPercentage,
          type: portfolio.type as "stock" | "crypto",
        });
      });
    });

    setMarketData(marketItems);
  };

  // Update prices for market data
  const updatePrices = (
    priceUpdates: {
      symbol: string;
      price: number;
      change: number;
      changePercent: number;
    }[]
  ) => {
    setMarketData((prev) =>
      prev.map((item) => {
        const update = priceUpdates.find((p) => p.symbol === item.symbol);
        if (update) {
          return {
            ...item,
            price: update.price,
            change: update.change,
            changePercent: update.changePercent,
          };
        }
        return item;
      })
    );
  };

  useEffect(() => {
    if (userId) {
      loadPortfolios();
    }
  }, [userId]);

  // Create portfolio
  const createPortfolio = async (type: "stock" | "crypto") => {
    try {
      await PortfolioService.createPortfolioAsync(type);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Delete portfolio
  const deletePortfolio = async (portfolioId: number) => {
    if (!confirm("Bu portföyü silmek istediğinizden emin misiniz?")) return;

    try {
      await PortfolioService.deletePortfolioAsync(portfolioId);
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

  // Calculate overall statistics
  const overallStats = {
    totalValue: portfolios.reduce((sum, p) => sum + p.totalValue, 0),
    totalInvestment: portfolios.reduce((sum, p) => sum + p.totalInvestment, 0),
    totalProfit: portfolios.reduce((sum, p) => sum + p.totalProfit, 0),
    profitPercentage:
      portfolios.length > 0
        ? (portfolios.reduce((sum, p) => sum + p.totalProfit, 0) /
            portfolios.reduce((sum, p) => sum + p.totalInvestment, 0)) *
          100
        : 0,
  };

  // Prepare chart data
  const portfolioChartData = portfolios.map((portfolio) => ({
    name: portfolio.type === "stock" ? "Hisse" : "Kripto",
    value: portfolio.totalValue,
    profit: portfolio.totalProfit,
    investment: portfolio.totalInvestment,
  }));

  // Custom label function for pie chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
        <div className="header-content">
          <h1>Portföy Yönetimi</h1>
          <p>Yatırımlarınızı takip edin ve performansınızı analiz edin</p>
        </div>
        <div className="portfolio-actions">
          <button
            className="create-btn stock-btn"
            onClick={() => createPortfolio("stock")}
          >
            <span className="btn-icon">📈</span>
            Hisse Portföyü
          </button>
          <button
            className="create-btn crypto-btn"
            onClick={() => createPortfolio("crypto")}
          >
            <span className="btn-icon">₿</span>
            Kripto Portföyü
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="portfolio-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Genel Bakış
        </button>
        <button
          className={`tab-btn ${activeTab === "details" ? "active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          🗂 Portföy Detayları
        </button>
        <button
          className={`tab-btn ${activeTab === "market" ? "active" : ""}`}
          onClick={() => setActiveTab("market")}
        >
          📈 Piyasa Verileri
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="overview-tab">
          {/* Overall Statistics */}
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <label>Toplam Portföy Değeri</label>
                <span className="value">
                  ₺
                  {overallStats.totalValue.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📥</div>
              <div className="stat-info">
                <label>Toplam Yatırım</label>
                <span className="value">
                  ₺
                  {overallStats.totalInvestment.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <div
              className={`stat-card ${
                overallStats.totalProfit >= 0 ? "profit" : "loss"
              }`}
            >
              <div className="stat-icon">
                {overallStats.totalProfit >= 0 ? "📈" : "📉"}
              </div>
              <div className="stat-info">
                <label>Toplam Kar/Zarar</label>
                <span className="value">
                  ₺
                  {overallStats.totalProfit.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}
                  <span className="percentage">
                    ({overallStats.profitPercentage.toFixed(2)}%)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Portföy Dağılımı</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={portfolioChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {portfolioChartData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `₺${Number(value).toLocaleString("tr-TR")}`,
                      "Değer",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Portföy Performansı</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={portfolioChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `₺${Number(value).toLocaleString("tr-TR")}`,
                      "Değer",
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="investment" fill="#8884d8" name="Yatırım" />
                  <Bar dataKey="value" fill="#82ca9d" name="Güncel Değer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="details-tab">
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
                    <h3>
                      {portfolio.type === "stock"
                        ? "Hisse Senetleri"
                        : "Kripto Varlıklar"}
                    </h3>
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

                {/* Portfolio-specific chart */}
                <div className="portfolio-chart">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={portfolio.items.map((item) => ({
                        name: item.symbol,
                        value: item.totalValue,
                        profit: item.profit,
                      }))}
                    >
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `₺${Number(value).toLocaleString("tr-TR")}`,
                          "Değer",
                        ]}
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
        </div>
      )}

      {/* Market Data Tab */}
      {activeTab === "market" && (
        <div className="market-tab">
          <div className="market-header">
            <h2>Canlı Piyasa Verileri</h2>
            <p>Portföyünüzdeki varlıkların güncel fiyatları</p>
          </div>

          <div className="market-grid">
            {marketData.map((item, index) => (
              <div key={`${item.symbol}-${index}`} className="market-card">
                <div className="market-symbol">
                  <span className="symbol">{item.symbol}</span>
                  <span className={`type-badge ${item.type}`}>
                    {item.type === "stock" ? "HISSE" : "KRİPTO"}
                  </span>
                </div>
                <div className="market-price">
                  <span className="price">
                    ₺
                    {item.price.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span
                    className={`change ${
                      item.change >= 0 ? "positive" : "negative"
                    }`}
                  >
                    {item.change >= 0 ? "↗" : "↘"}
                    {item.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {marketData.length === 0 && (
            <div className="no-market-data">
              <p>Henüz piyasa verisi bulunmuyor</p>
            </div>
          )}
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
