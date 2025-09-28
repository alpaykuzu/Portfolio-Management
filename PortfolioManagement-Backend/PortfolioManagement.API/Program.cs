using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PortfolioManagement.Core.Interfaces;
using PortfolioManagement.Core.Repositories;
using PortfolioManagement.Core.UnitofWork;
using PortfolioManagement.Data;
using PortfolioManagement.Data.Configurations;
using PortfolioManagement.Data.Initializers;
using PortfolioManagement.Data.Repositories;
using PortfolioManagement.Data.UnitofWork;
using PortfolioManagement.Service.Hubs;
using PortfolioManagement.Service.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

//CORS ayarları
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

//JWT Authentication ayarları
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),
        ClockSkew = TimeSpan.Zero
    };
});

//DbContext ayarları
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Portfolio Management API", Version = "v1" });

    // JWT Authentication için tanım
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Dependency Injection
builder.Services.AddHttpClient();
builder.Services.AddScoped<DbContext, AppDbContext>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IUnitofWork, UnitofWork>();
builder.Services.AddScoped<IBinanceService, BinanceService>();
builder.Services.AddScoped<YahooFinanceService>();
builder.Services.AddScoped<IPriceService, PriceService>();
builder.Services.AddScoped<ISymbolService, SymbolService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPortfolioService, PortfolioService>();
builder.Services.AddHostedService<PriceUpdateService>();

//Automapper
builder.Services.AddAutoMapper(cfg => cfg.AddProfile<AutoMapperProfile>());

//HttpContextAccessor
builder.Services.AddHttpContextAccessor();

//SignalR
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true; // Only for development
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
});

var app = builder.Build();

// DbInitializer çağrısı
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var binanceService = scope.ServiceProvider.GetRequiredService<IBinanceService>();

    // BIST Stocks JSON'dan DB'ye ekle
    await DbInitializer.SeedBISTStocksAsync(context);

    // Binance API'den Crypto varlıkları ekle
    await DbInitializer.SeedCryptoAssetsFromBinanceAsync(context, binanceService);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors();

//app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

// SignalR Hub
app.MapHub<PortfolioHub>("/portfolioHub");

app.Run();
