using Microsoft.EntityFrameworkCore;
using PortfolioManagement.Core.UnitofWork;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Data.UnitofWork
{
    public class UnitofWork : IUnitofWork
    {
        private readonly DbContext _dbContext;

        public UnitofWork(DbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task CommitAsync()
        {
            await _dbContext.SaveChangesAsync();
        }

        public void Dispose()
        {
            _dbContext.Dispose();
        }
    }
}
