namespace PortfolioManagement.Core.Models
{
    public class PortfolioItem
    {
        public int Id { get; set; }
        public int PortfolioId { get; set; }
        public string Symbol { get; set; } // BIST veya kripto sembolü
        public string Type { get; set; } // crypto, stock
        public decimal BuyPrice { get; set; } // kullanıcı aldığı fiyat
        public int Quantity { get; set; } // kaç adet aldığı

        public DateTime CreatedAt = DateTime.UtcNow;
        public DateTime PurchaseDate { get; set; }
        public Portfolio Portfolio { get; set; }
    }
}