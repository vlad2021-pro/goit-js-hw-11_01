import './sass/main.scss';
import { Notify } from 'notiflix';
import 'notiflix/dist/notiflix-3.2.2.min.css';
import Simplelightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import axios from 'axios';

const refs = {
  form: document.querySelector('.search-form'),
  input: document.querySelector('.search-form__input'),
  loadMoreButton: document.querySelector('.load-more'),
  galleryList: document.querySelector('.gallery'),
};


const lightBoxList = {
  captionsData: 'alt',
  captionDelay: 250,
  captionPosition: 'bottom',
  showCounter: true,
};

const BASE_URL = 'https://pixabay.com/api/';
const searchOptions = {
  key: '11408941-3cf7894bd0fa3b9fec7ed7cf5',
  q: '',
  image_type: 'photo',
  orientation: 'horizontal',
  safesearch: true,
  per_page: 40,
  page: 1,
};

refs.form.addEventListener('submit', onFormSubmit);
refs.loadMoreButton.addEventListener('click', onClickButtonLoadMore);

let gallery = new Simplelightbox('.gallery a', lightBoxList);

function onClick(evt) {
  evt.preventDefault();
  gallery.open('.gallery');
}

async function onFormSubmit(evt) {
  evt.preventDefault();
  searchOptions.page = 0;
  searchOptions.q = evt.currentTarget.elements.searchQuery.value;

  if (searchOptions.q === '') {
    showInfoNotification();
    clearPreviousRequest();
    return;
  }

  try {
    const collection = await onFetchCollection();
    successfulFunctionExecution(collection);
  } catch (error) {
    showFailureNotification();
  }
  refs.form.reset();
}

function successfulFunctionExecution(answer) {
  clearPreviousRequest();
  renderMarkup(answer);
  refs.galleryList.addEventListener('click', onClick);
  gallery.refresh();
  showSuccessNotification(answer);
}

async function onFetchCollection() {
  searchOptions.page += 1;
  const searchParams = { params: searchOptions };
  const response = await axios.get(BASE_URL, searchParams);

  if (response.data.hits.length === 0) {
    throw new Error('Whoops');
  }
  return response;
}

async function onClickButtonLoadMore() {
  try {
    const collection = await onFetchCollection();
    renderMarkup(collection);
    gallery.refresh();
    smoothScrolling();
  } catch (error) {
    errorNotificationEndOfRequest();
    refs.loadMoreButton.classList.add('visually-hidden');
  }
}

function clearPreviousRequest() {
  refs.galleryList.removeEventListener('click', onClick);
  refs.galleryList.innerHTML = '';
  refs.loadMoreButton.classList.add('visually-hidden');
}

function smoothScrolling() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

function renderMarkup({ data }) {
  const markup = data.hits
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `<div class="photo-card">
  <a href="${largeImageURL}" class="photo-link" >
    <img src="${webformatURL}" alt="${tags}" loading="lazy" class="photo-img"/>
  </a>
  <div class="info">
    <p class="info-item">
      <b>Likes</b> ${likes}
    </p>
    
    <p class="info-item">
      <b>Views</b> ${views}
    </p>
    
    <p class="info-item">
      <b>Comments</b> ${comments}
    </p>
    
    <p class="info-item">
      <b>Downloads</b> ${downloads}
    </p>
    <i class="bi bi-download"></i>
    
  </div>
</div>`,
    )
    .join('');

  refs.galleryList.insertAdjacentHTML('beforeend', markup);
  refs.loadMoreButton.classList.remove('visually-hidden');
}

function errorNotificationEndOfRequest() {
  Notify.failure("We're sorry, but you've reached the end of search results.");
}

function showFailureNotification() {
  Notify.failure('Sorry, there are no images matching your search query. Please try again.');
}

function showSuccessNotification(answer) {
  Notify.success(`Hooray! We found ${answer.data.totalHits} images.`);
}

function showInfoNotification() {
  Notify.info("The search term couldn't be empty.");
}