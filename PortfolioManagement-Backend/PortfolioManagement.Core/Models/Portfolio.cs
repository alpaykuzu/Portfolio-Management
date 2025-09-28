using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Models
{
    public class Portfolio
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Type { get; set; } //stock, crypto
        public User User { get; set; }
        public ICollection<PortfolioItem> Items { get; set; }
    }
}
