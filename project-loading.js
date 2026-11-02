(() => {
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.loading = 'eager'; observer.unobserve(entry.target); }
    });
  }, { rootMargin: '1600px 0px' }) : null;
  document.querySelectorAll('.figma-figure img').forEach(img => {
    const figure = img.closest('figure');
    const status = document.createElement('span');
    status.className = 'media-status';
    status.textContent = '图片加载中';
    status.setAttribute('role', 'status');
    figure.appendChild(status);
    const ready = () => {
      figure.classList.remove('media-loading', 'media-error');
      figure.removeAttribute('aria-busy');
      status.remove();
    };
    const failed = () => {
      figure.classList.remove('media-loading');
      figure.classList.add('media-error');
      figure.removeAttribute('aria-busy');
      status.textContent = '图片未加载成功，点击重试';
      status.setAttribute('role', 'button');
      status.tabIndex = 0;
    };
    const retry = event => {
      event.stopPropagation();
      if (!figure.classList.contains('media-error')) return;
      figure.classList.remove('media-error');
      figure.classList.add('media-loading');
      figure.setAttribute('aria-busy', 'true');
      status.textContent = '图片加载中';
      status.setAttribute('role', 'status');
      status.removeAttribute('tabindex');
      const pictureSource = img.parentElement.querySelector('source');
      const suffix = 'retry=' + Date.now();
      if (pictureSource) pictureSource.srcset = pictureSource.srcset.split('?')[0] + '?' + suffix;
      img.src = img.src.split('?')[0] + '?' + suffix;
    };
    status.addEventListener('click', retry);
    status.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); retry(e); } });
    img.addEventListener('load', ready);
    img.addEventListener('error', failed);
    if (img.complete && img.naturalWidth) ready();
    else if (img.complete) failed();
    else { figure.classList.add('media-loading'); figure.setAttribute('aria-busy', 'true'); }
    if (observer) observer.observe(img);
  });
})();
