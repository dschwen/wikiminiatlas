export function wikipediaArticleFromUrl(input) {
  let url;
  try {
    url = input instanceof URL ? input : new URL(input);
  } catch (error) {
    return null;
  }
  const match = /^([a-z][a-z0-9-]*)\.wikipedia\.org$/i.exec(url.hostname);
  if (!match || !url.pathname.startsWith('/wiki/')) {
    return null;
  }
  const page = url.pathname.slice('/wiki/'.length);
  return page ? { language: match[1].toLowerCase(), page } : null;
}

export function wikipediaSummaryUrl(article) {
  return `https://${article.language}.wikipedia.org/api/rest_v1/page/summary/${article.page}`;
}

export class GlobeArticlePreview {
  constructor(container, {
    interactionElement,
    fetchImpl = (...args) => fetch(...args)
  } = {}) {
    if (!(container instanceof HTMLElement) || !(interactionElement instanceof HTMLElement)) {
      throw new TypeError('preview container and interaction element must be HTML elements');
    }
    this.container = container;
    this.interactionElement = interactionElement;
    this.fetchImpl = fetchImpl;
    this.cache = new Map();
    this.controller = null;
    this.currentKey = '';

    this.onPointerOver = (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      const anchor = event.target.closest && event.target.closest('.globe-label');
      const article = anchor ? wikipediaArticleFromUrl(anchor.href) : null;
      if (article) {
        this.show(article);
      } else {
        this.hide();
      }
    };
    this.onPointerLeave = (event) => {
      if ((event.ctrlKey || event.metaKey) && !event.relatedTarget) {
        this.hide();
      }
    };
    this.onContainerClick = (event) => {
      if (event.target === this.container || event.target.closest('[data-preview-close]')) {
        this.hide();
      }
    };
    interactionElement.addEventListener('pointerover', this.onPointerOver);
    interactionElement.addEventListener('pointerleave', this.onPointerLeave);
    container.addEventListener('click', this.onContainerClick);
  }

  async show(article) {
    const key = `${article.language}/${article.page}`;
    if (key === this.currentKey && !this.container.hidden) {
      return;
    }
    this.currentKey = key;
    if (this.controller) {
      this.controller.abort();
    }
    if (this.cache.has(key)) {
      this.render(this.cache.get(key));
      return;
    }

    const controller = new AbortController();
    this.controller = controller;
    try {
      const response = await this.fetchImpl(wikipediaSummaryUrl(article), {
        signal: controller.signal,
        credentials: 'omit'
      });
      if (!response.ok) {
        throw new Error(`Summary request failed with HTTP ${response.status}`);
      }
      const summary = await response.json();
      if (this.currentKey !== key) {
        return;
      }
      this.cache.set(key, summary);
      this.render(summary);
    } catch (error) {
      if (error.name !== 'AbortError' && this.currentKey === key) {
        this.hide();
      }
    } finally {
      if (this.controller === controller) {
        this.controller = null;
      }
    }
  }

  render(summary) {
    const content = document.createElement('div');
    content.className = 'article-preview-content';
    content.dir = summary.dir === 'rtl' ? 'rtl' : 'ltr';
    const close = document.createElement('button');
    close.type = 'button';
    close.dataset.previewClose = '';
    close.className = 'article-preview-close';
    close.setAttribute('aria-label', 'Close article preview');
    close.textContent = '×';
    const title = document.createElement('strong');
    title.textContent = summary.title || '';
    const extract = document.createElement('p');
    extract.textContent = summary.extract || '';
    content.append(close, title, extract);
    if (summary.thumbnail && summary.thumbnail.source) {
      const image = new Image();
      image.src = summary.thumbnail.source;
      image.alt = summary.title || '';
      image.className = 'article-preview-thumbnail';
      content.prepend(image);
    }
    this.container.replaceChildren(content);
    this.container.hidden = false;
  }

  hide() {
    this.currentKey = '';
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    this.container.hidden = true;
  }

  destroy() {
    this.hide();
    this.interactionElement.removeEventListener('pointerover', this.onPointerOver);
    this.interactionElement.removeEventListener('pointerleave', this.onPointerLeave);
    this.container.removeEventListener('click', this.onContainerClick);
    this.cache.clear();
  }
}
