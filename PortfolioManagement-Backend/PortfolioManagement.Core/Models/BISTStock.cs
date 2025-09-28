using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Models
{
    public class BISTStock
    {
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } //nvarchar

        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } //nvarchar

        [JsonPropertyName("logoUrl")]
        public string? LogoUrl { get; set; } //nvarchar
    }
}
