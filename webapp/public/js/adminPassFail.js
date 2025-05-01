document.addEventListener('DOMContentLoaded', () => {
  const filter = document.getElementById('subjectFilter');
  filter.addEventListener('change', () => {
    const selected = filter.value;
    const allRows = document.querySelectorAll('tr[data-subject]');

    allRows.forEach(row => {
      const subject = row.getAttribute('data-subject');
      row.style.display = (selected === 'all' || subject === selected) ? '' : 'none';
    });
  });
});