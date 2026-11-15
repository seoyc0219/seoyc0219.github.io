const categories = document.querySelectorAll('[data-category]');
categories.forEach(button => {
  button.addEventListener('click', () => {
    categories.forEach(category => {
      const active = category === button;
      category.classList.toggle('active', active);
      category.setAttribute('aria-pressed', String(active));
    });
    document.querySelector('#empty-title').textContent = `${button.dataset.category} 카테고리에 아직 글이 없어요.`;
  });
});
