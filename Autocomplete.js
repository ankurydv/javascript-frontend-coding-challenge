export default class Autocomplete {
    constructor(rootEl, options = {}) {
        options = Object.assign({numOfResults: 10, data: [], url: ''}, options);
        Object.assign(this, {rootEl, options});

        this.init();
    }

    onQueryChange(query) {
        // Get data for the dropdown

        if (this.options.url !== '') {
            this.getResultsFromEndpoint(query, this.options.url).then(data => {
                this.updateDropdown(data.slice(0, this.options.numOfResults));
            });
        } else {
            let results = this.getResults(query, this.options.data);
            results = results.slice(0, this.options.numOfResults);
            this.updateDropdown(results);
        }
    }

    /**
     * Given an array and a query, return a filtered array based on the query.
     */
    getResults(query, data) {
        if (!query) return [];
        // Filter for matching strings
        let results = data.filter((item) => {
            return item.text.toLowerCase().includes(query.toLowerCase());
        });
        return results;
    }

    getResultsFromEndpoint(query, url) {
        if (!query) return Promise.resolve([]);

        let urlWithQuery = url.replace('${query}', query);
        return fetch(urlWithQuery).then(response => response.json()).then(data => {
            return data.items.map(item => ({
                text: item.login,
                value: item.id
            })).filter(item => item.text.toLowerCase().startsWith(query.toLowerCase()));
        });
    }

    updateDropdown(results) {
        this.listEl.innerHTML = '';
        this.listEl.appendChild(this.createResultsEl(results));
    }

    createResultsEl(results) {
        const fragment = document.createDocumentFragment();
        results.forEach((result) => {
            const el = document.createElement('li');
            Object.assign(el, {
                className: 'result',
                textContent: result.text,
            });

            // Pass the value to the onSelect callback
            el.addEventListener('click', (event) => {
                event.target.parentElement.previousSibling.value = result.text;
                const {onSelect} = this.options;
                if (typeof onSelect === 'function') onSelect(result.value);
            });

            fragment.appendChild(el);
        });
        return fragment;
    }

    createQueryInputEl() {
        const inputEl = document.createElement('input');
        Object.assign(inputEl, {
            type: 'search',
            name: 'query',
            autocomplete: 'off',
        });

        inputEl.addEventListener('input', event =>
            this.onQueryChange(event.target.value));

        inputEl.addEventListener('keydown', event => {
            switch (event.key) {
                case 'ArrowDown':
                    this.keyUpOrDownAction(event, 'nextSibling');
                    break;
                case 'ArrowUp' :
                    this.keyUpOrDownAction(event, 'previousSibling');
                    break;
                case 'Enter' :
                    let listElements = [...event.target.nextSibling.childNodes];
                    if (listElements.length > 0) {
                        let highlightedListElement = listElements.find(child => child.style.backgroundColor !== '');
                        if (highlightedListElement) {
                            event.target.value = highlightedListElement.textContent;
                        }
                    }
                    break;
                default :
                    console.log('we do not care about any other key');
            }
        });

        return inputEl;
    }

    keyUpOrDownAction(event, siblingToLookFor) {
        let listElements = [...event.target.nextSibling.childNodes];
        let indexOfFirstListElementToSelect = siblingToLookFor === 'nextSibling' ? 0 : listElements.length - 1;
        if (listElements.length > 0) {
            let highlightedListElement = listElements.find(child => child.style.backgroundColor !== '');
            if (highlightedListElement && highlightedListElement[siblingToLookFor]) {
                highlightedListElement.style.backgroundColor = '';
                highlightedListElement[siblingToLookFor].style.backgroundColor = '#eee';
            } else if (highlightedListElement && !highlightedListElement[siblingToLookFor]) {
                highlightedListElement.style.backgroundColor = '';
                listElements[indexOfFirstListElementToSelect].style.backgroundColor = '#eee'
            } else {
                listElements[indexOfFirstListElementToSelect].style.backgroundColor = '#eee'
            }
        }
    }

    init() {
        // Build query input
        this.inputEl = this.createQueryInputEl();
        this.rootEl.appendChild(this.inputEl)

        // Build results dropdown
        this.listEl = document.createElement('ul');
        Object.assign(this.listEl, {className: 'results'});
        this.rootEl.appendChild(this.listEl);
    }

}
