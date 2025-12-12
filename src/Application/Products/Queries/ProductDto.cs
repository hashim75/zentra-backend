namespace Application.Products.Queries
{
    public class ProductDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Barcode { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public decimal SalePrice { get; set; }
        public int StockQuantity { get; set; }
        public int LowStockAlert { get; set; }
        public string CategoryName { get; set; } = string.Empty; // Flattened
    }
}