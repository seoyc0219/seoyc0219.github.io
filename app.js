const categories = document.querySelectorAll('[data-category]');
const posts = document.querySelectorAll('[data-post-categories]');
const emptyState = document.querySelector('#empty-state');
const emptyTitle = document.querySelector('#empty-title');
let selectedCategory = null;
function filterPosts() {
  let visible = 0;
  posts.forEach(post => {
    const names = JSON.parse(post.dataset.postCategories);
    const matches = selectedCategory === null || names.includes(selectedCategory);
    post.hidden = !matches;
    if (matches) visible++;
  });
  categories.forEach(button => {
    const active = button.dataset.category === selectedCategory;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (emptyState) emptyState.hidden = visible > 0;
  if (emptyTitle) emptyTitle.textContent = selectedCategory
    ? `${selectedCategory} 카테고리에 아직 글이 없어요.`
    : '아직 작성된 글이 없어요.';
}
categories.forEach(button => button.addEventListener('click', () => {
  selectedCategory = selectedCategory === button.dataset.category ? null : button.dataset.category;
  filterPosts();
}));
filterPosts();
