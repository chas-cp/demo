function submitForm(e){
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  alert(`Thanks ${data.name || ''}! We'll reach out at ${data.email}.`);
  form.reset();
  return false;
}

// mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle){
  toggle.addEventListener('click', ()=>{
    if (getComputedStyle(links).display === 'none') { links.style.display = 'flex'; }
    else { links.style.display = 'none'; }
  });
}

document.getElementById('year').textContent = new Date().getFullYear();
