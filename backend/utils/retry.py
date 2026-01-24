import asyncio
import logging
from typing import Callable, TypeVar, Any
from functools import wraps

logger = logging.getLogger(__name__)

T = TypeVar('T')


class RetryConfig:
    """Configuration for retry logic"""
    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_backoff: bool = True,
        jitter: bool = True,
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_backoff = exponential_backoff
        self.jitter = jitter


async def retry_async(
    func: Callable[..., T],
    config: RetryConfig | None = None,
    error_types: tuple[type[Exception], ...] = (Exception,),
    context: str = "",
) -> T:
    """
    Retry an async function with exponential backoff.
    
    Args:
        func: Async function to retry
        config: Retry configuration
        error_types: Exception types that trigger retry
        context: Context string for logging
    
    Returns:
        Result of the function
    
    Raises:
        Last exception if all retries exhausted
    """
    if config is None:
        config = RetryConfig()
    
    last_exception = None
    
    for attempt in range(config.max_retries + 1):
        try:
            return await func()
        except error_types as e:
            last_exception = e
            
            if attempt == config.max_retries:
                logger.error(
                    f"{context}: All {config.max_retries} retries exhausted. "
                    f"Final error: {str(e)}"
                )
                raise
            
            delay = _calculate_delay(attempt, config)
            logger.warning(
                f"{context}: Attempt {attempt + 1}/{config.max_retries} failed. "
                f"Error: {str(e)}. Retrying in {delay:.2f}s..."
            )
            await asyncio.sleep(delay)
    
    raise last_exception


def retry_sync(
    func: Callable[..., T],
    config: RetryConfig | None = None,
    error_types: tuple[type[Exception], ...] = (Exception,),
    context: str = "",
) -> T:
    """
    Retry a sync function with exponential backoff.
    
    Args:
        func: Sync function to retry
        config: Retry configuration
        error_types: Exception types that trigger retry
        context: Context string for logging
    
    Returns:
        Result of the function
    
    Raises:
        Last exception if all retries exhausted
    """
    import time
    
    if config is None:
        config = RetryConfig()
    
    last_exception = None
    
    for attempt in range(config.max_retries + 1):
        try:
            return func()
        except error_types as e:
            last_exception = e
            
            if attempt == config.max_retries:
                logger.error(
                    f"{context}: All {config.max_retries} retries exhausted. "
                    f"Final error: {str(e)}"
                )
                raise
            
            delay = _calculate_delay(attempt, config)
            logger.warning(
                f"{context}: Attempt {attempt + 1}/{config.max_retries} failed. "
                f"Error: {str(e)}. Retrying in {delay:.2f}s..."
            )
            time.sleep(delay)
    
    raise last_exception


def _calculate_delay(attempt: int, config: RetryConfig) -> float:
    """Calculate delay for retry attempt."""
    delay = config.base_delay
    
    if config.exponential_backoff:
        delay *= (2 ** attempt)
    
    delay = min(delay, config.max_delay)
    
    if config.jitter:
        import random
        delay *= (0.5 + random.random() * 0.5)
    
    return delay


def with_retry(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    error_types: tuple[type[Exception], ...] = (Exception,),
):
    """
    Decorator for adding retry logic to functions.
    
    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Base delay between retries in seconds
        max_delay: Maximum delay between retries in seconds
        error_types: Exception types to catch and retry
    
    Usage:
        @with_retry(max_retries=3, error_types=(APIError,))
        async def my_function():
            return await api_call()
    """
    config = RetryConfig(
        max_retries=max_retries,
        base_delay=base_delay,
        max_delay=max_delay,
    )
    
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            async def _func():
                return await func(*args, **kwargs)
            return await retry_async(
                _func,
                config=config,
                error_types=error_types,
                context=f"{func.__name__}",
            )
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            def _func():
                return func(*args, **kwargs)
            return retry_sync(
                _func,
                config=config,
                error_types=error_types,
                context=f"{func.__name__}",
            )
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator