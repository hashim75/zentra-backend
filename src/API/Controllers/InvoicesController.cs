using Microsoft.AspNetCore.Mvc;
using Application.Invoices.Commands.CreateInvoice;
using Application.Invoices.Commands; 
using Microsoft.AspNetCore.Authorization;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence; 

namespace API.Controllers
{
    [Authorize]
    public class InvoicesController : ApiControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InvoicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. GET: api/Invoices (FIXED: Now includes Customer & Items)
        [HttpGet]
        public async Task<ActionResult<List<Invoice>>> GetInvoices()
        {
            return await _context.Invoices
                .Include(i => i.Items)      // Load Products
                .Include(i => i.Customer)   // <--- FIX: Load Customer Name
                .OrderByDescending(i => i.Date)
                .ToListAsync();
        }

        // 2. POST: api/Invoices (Checkout)
        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateInvoiceCommand command)
        {
            return await Mediator.Send(command);
        }

        // 3. POST: Return Invoice (Refund)
        [HttpPost("{id}/return")]
        public async Task<ActionResult> ReturnInvoice(Guid id)
        {
            await Mediator.Send(new ReturnInvoiceCommand { InvoiceId = id });
            return NoContent();
        }
    }
}