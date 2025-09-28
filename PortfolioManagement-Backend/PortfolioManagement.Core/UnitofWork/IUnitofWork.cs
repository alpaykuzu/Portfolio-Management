using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.UnitofWork
{
    public interface IUnitofWork : IDisposable
    {
        Task CommitAsync();
    }
}
