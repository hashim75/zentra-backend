using Application.Common.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace API.Filters
{
    public class ApiExceptionFilterAttribute : ExceptionFilterAttribute
    {
        public override void OnException(ExceptionContext context)
        {
            // Fix: Use pattern matching "is ... exception" to avoid null warnings
            if (context.Exception is NotFoundException notFoundEx)
            {
                context.Result = new NotFoundObjectResult(new { error = notFoundEx.Message });
                context.ExceptionHandled = true;
            }
            else if (context.Exception is ValidationException validationEx)
            {
                context.Result = new BadRequestObjectResult(new { error = validationEx.Message });
                context.ExceptionHandled = true;
            }
            else
            {
                // Unhandled errors
                context.Result = new ObjectResult(new { error = "An unexpected error occurred." })
                {
                    StatusCode = 500
                };
                context.ExceptionHandled = true;
            }
            base.OnException(context);
        }
    }
}