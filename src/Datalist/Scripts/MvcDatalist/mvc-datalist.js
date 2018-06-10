﻿/*!
 * Datalist 6.0.0
 * https://github.com/NonFactors/MVC5.Datalist
 *
 * Copyright © NonFactors
 *
 * Licensed under the terms of the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */
var MvcDatalistFilter = (function () {
    function MvcDatalistFilter(datalist) {
        var group = datalist.group;

        this.datalist = datalist;
        this.sort = group.dataset.sort;
        this.order = group.dataset.order;
        this.search = group.dataset.search;
        this.page = parseInt(group.dataset.page);
        this.rows = parseInt(group.dataset.rows);
        this.additionalFilters = group.dataset.filters.split(',').filter(Boolean);
    }

    MvcDatalistFilter.prototype = {
        formUrl: function (search) {
            var url = this.datalist.url.split('?')[0];
            var urlQuery = this.datalist.url.split('?')[1];
            var filter = this.datalist.extend({ ids: [], checkIds: [], selected: [] }, this, search);
            var query = '?' + (urlQuery ? urlQuery + '&' : '') + 'search=' + encodeURIComponent(filter.search);

            for (var i = 0; i < this.additionalFilters.length; i++) {
                var filters = document.querySelectorAll('[name="' + this.additionalFilters[i] + '"]');
                for (var j = 0; j < filters.length; j++) {
                    query += '&' + encodeURIComponent(this.additionalFilters[i]) + '=' + encodeURIComponent(filters[j].value);
                }
            }

            for (i = 0; i < filter.selected.length; i++) {
                query += '&selected=' + encodeURIComponent(filter.selected[i].DatalistIdKey);
            }

            for (i = 0; i < filter.checkIds.length; i++) {
                query += '&checkIds=' + encodeURIComponent(filter.checkIds[i].value);
            }

            for (i = 0; i < filter.ids.length; i++) {
                query += '&ids=' + encodeURIComponent(filter.ids[i].value);
            }

            query += '&sort=' + encodeURIComponent(filter.sort) +
                '&order=' + encodeURIComponent(filter.order) +
                '&rows=' + encodeURIComponent(filter.rows) +
                '&page=' + encodeURIComponent(filter.page) +
                '&_=' + Date.now();

            return url + query;
        }
    };

    return MvcDatalistFilter;
}());
var MvcDatalistDialog = (function () {
    function MvcDatalistDialog(datalist) {
        this.datalist = datalist;
        this.title = datalist.group.dataset.title;
        this.instance = document.getElementById(datalist.group.dataset.dialog);
        this.options = { preserveSearch: true, rows: { min: 1, max: 99 }, openDelay: 100 };

        this.overlay = new MvcDatalistOverlay(this);
        this.table = this.instance.querySelector('table');
        this.tableHead = this.instance.querySelector('thead');
        this.tableBody = this.instance.querySelector('tbody');
        this.rows = this.instance.querySelector('.datalist-rows');
        this.pager = this.instance.querySelector('.datalist-pager');
        this.header = this.instance.querySelector('.datalist-title');
        this.search = this.instance.querySelector('.datalist-search');
        this.selector = this.instance.querySelector('.datalist-selector');
        this.closeButton = this.instance.querySelector('.datalist-close');
        this.error = this.instance.querySelector('.datalist-dialog-error');
        this.loader = this.instance.querySelector('.datalist-dialog-loader');
    }

    MvcDatalistDialog.prototype = {
        open: function () {
            var dialog = this;
            var filter = dialog.datalist.filter;
            MvcDatalistDialog.prototype.current = this;

            dialog.error.style.display = 'none';
            dialog.loader.style.display = 'none';
            dialog.header.innerText = dialog.title;
            dialog.selected = dialog.datalist.selected.slice();
            dialog.rows.value = dialog.limitRows(filter.rows);
            dialog.error.innerHTML = dialog.datalist.lang['error'];
            filter.search = dialog.options.preserveSearch ? filter.search : '';
            dialog.selector.style.display = dialog.datalist.multi ? '' : 'none';
            dialog.search.setAttribute('placeholder', dialog.datalist.lang['search']);
            dialog.selector.innerText = dialog.datalist.lang['select'].replace('{0}', dialog.datalist.selected.length);

            dialog.bind();
            dialog.refresh();
            dialog.search.value = filter.search;

            setTimeout(function () {
                if (dialog.isLoading) {
                    dialog.loader.style.opacity = 1;
                    dialog.loader.style.display = '';
                }

                dialog.overlay.show();
            }, dialog.options.openDelay);
        },
        close: function () {
            var dialog = MvcDatalistDialog.prototype.current;
            dialog.datalist.group.classList.remove('datalist-error');

            dialog.datalist.stopLoading();
            dialog.overlay.hide();

            if (dialog.datalist.multi) {
                dialog.datalist.select(dialog.selected, true);
                dialog.datalist.search.focus();
            }

            MvcDatalistDialog.prototype.current = null;
        },
        refresh: function () {
            var dialog = this;
            dialog.isLoading = true;
            dialog.error.style.opacity = 0;
            dialog.error.style.display = '';
            dialog.loader.style.display = '';
            var loading = setTimeout(function () {
                dialog.loader.style.opacity = 1;
            }, dialog.datalist.options.loadingDelay);

            dialog.datalist.startLoading({ selected: dialog.selected }, function (data) {
                dialog.isLoading = false;
                clearTimeout(loading);
                dialog.render(data);
            }, function () {
                dialog.isLoading = false;
                clearTimeout(loading);
                dialog.render();
            });
        },

        render: function (data) {
            var dialog = this;
            dialog.pager.innerHTML = '';
            dialog.tableBody.innerHTML = '';
            dialog.tableHead.innerHTML = '';
            dialog.loader.style.opacity = 0;
            setTimeout(function () {
                dialog.loader.style.display = 'none';
            }, dialog.datalist.options.loadingDelay);

            if (data) {
                dialog.error.style.display = 'none';

                dialog.renderHeader(data.Columns);
                dialog.renderBody(data.Columns, data.Rows);
                dialog.renderFooter(data.FilteredRows);
            } else {
                dialog.error.style.opacity = 1;
            }
        },
        renderHeader: function (columns) {
            var row = document.createElement('tr');

            for (var i = 0; i < columns.length; i++) {
                if (!columns[i].Hidden) {
                    row.appendChild(this.createHeaderColumn(columns[i]));
                }
            }

            row.appendChild(document.createElement('th'));
            this.tableHead.appendChild(row);
        },
        renderBody: function (columns, rows) {
            if (!rows.length) {
                var empty = document.createElement('td');
                var row = document.createElement('tr');

                empty.setAttribute('colspan', columns.length + 1);
                empty.innerHTML = this.datalist.lang['noData'];
                row.className = 'datalist-empty';

                this.tableBody.appendChild(row);
                row.appendChild(empty);
            }

            var hasSplit = false;
            var hasSelection = rows.length && this.datalist.indexOf(this.selected, rows[0].DatalistIdKey) >= 0;

            for (var i = 0; i < rows.length; i++) {
                var row = this.createDataRow(rows[i]);
                var selection = document.createElement('td');

                for (var j = 0; j < columns.length; j++) {
                    if (!columns[j].Hidden) {
                        var data = document.createElement('td');
                        data.className = columns[j].CssClass || '';
                        data.innerText = rows[i][columns[j].Key] || '';

                        row.appendChild(data);
                    }
                }

                row.appendChild(selection);

                if (!hasSplit && hasSelection && this.datalist.indexOf(this.selected, rows[i].DatalistIdKey) < 0) {
                    var separator = document.createElement('tr');
                    var empty = document.createElement('td');

                    empty.setAttribute('colspan', columns.length + 1);
                    separator.className = 'datalist-split';

                    this.tableBody.appendChild(separator);
                    separator.appendChild(empty);

                    hasSplit = true;
                }

                this.tableBody.appendChild(row);
            }
        },
        renderFooter: function (filteredRows) {
            var dialog = this;
            var filter = dialog.datalist.filter;
            var totalPages = Math.ceil(filteredRows / filter.rows);
            dialog.totalRows = filteredRows + dialog.selected.length;

            if (totalPages) {
                var startingPage = Math.floor(filter.page / 4) * 4;

                if (filter.page && 4 < totalPages) {
                    dialog.renderPage('&laquo', 0);
                    dialog.renderPage('&lsaquo;', filter.page - 1);
                }

                for (var i = startingPage; i < totalPages && i < startingPage + 4; i++) {
                    dialog.renderPage(i + 1, i);
                }

                if (4 < totalPages && filter.page < totalPages - 1) {
                    dialog.renderPage('&rsaquo;', filter.page + 1);
                    dialog.renderPage('&raquo;', totalPages - 1);
                }
            } else {
                dialog.renderPage(1, 0);
            }
        },
        renderPage: function (text, value) {
            var page = document.createElement('button');
            var filter = this.datalist.filter;
            page.type = 'button';
            var dialog = this;

            if (filter.page == value) {
                page.className = 'active';
            }

            page.innerHTML = text;
            page.addEventListener('click', function () {
                if (filter.page != value) {
                    var expectedPages = Math.ceil((dialog.totalRows - dialog.selected.length) / filter.rows) - 1;
                    filter.page = Math.min(value, expectedPages);

                    dialog.refresh();
                }
            });

            dialog.pager.appendChild(page);
        },

        createHeaderColumn: function (column) {
            var header = document.createElement('th');
            var filter = this.datalist.filter;
            var dialog = this;

            if (column.CssClass) {
                header.classList.add(column.CssClass);
            }

            if (filter.sort == column.Key) {
                header.classList.add('datalist-' + filter.order.toLowerCase());
            }

            header.innerText = column.Header || '';
            header.addEventListener('click', function () {
                filter.order = filter.sort == column.Key && filter.order == 'Asc' ? 'Desc' : 'Asc';
                filter.sort = column.Key;

                dialog.refresh();
            });

            return header;
        },
        createDataRow: function (data) {
            var dialog = this;
            var datalist = this.datalist;
            var row = document.createElement('tr');
            if (datalist.indexOf(dialog.selected, data.DatalistIdKey) >= 0) {
                row.className = 'selected';
            }

            row.addEventListener('click', function () {
                if (!window.getSelection().isCollapsed) {
                    return;
                }

                var index = datalist.indexOf(dialog.selected, data.DatalistIdKey);
                if (index >= 0) {
                    if (datalist.multi) {
                        dialog.selected.splice(index, 1);

                        this.classList.remove('selected');
                    }
                } else {
                    if (datalist.multi) {
                        dialog.selected.push(data);
                    } else {
                        dialog.selected = [data];
                    }

                    this.classList.add('selected');
                }

                if (datalist.multi) {
                    dialog.selector.innerText = dialog.datalist.lang['select'].replace('{0}', dialog.selected.length);
                } else {
                    datalist.select(dialog.selected, true);

                    dialog.close();

                    datalist.search.focus();
                }
            });

            return row;
        },

        limitRows: function (value) {
            var options = this.options.rows;

            return Math.min(Math.max(parseInt(value), options.min), options.max) || this.datalist.filter.rows;
        },

        bind: function () {
            this.search.removeEventListener('keyup', this.searchChanged);
            this.closeButton.removeEventListener('click', this.close);
            this.rows.removeEventListener('change', this.rowsChanged);
            this.selector.removeEventListener('click', this.close);

            this.search.addEventListener('keyup', this.searchChanged);
            this.closeButton.addEventListener('click', this.close);
            this.rows.addEventListener('change', this.rowsChanged);
            this.selector.addEventListener('click', this.close);
        },
        rowsChanged: function () {
            var dialog = MvcDatalistDialog.prototype.current;
            var rows = dialog.limitRows(this.value);
            this.value = rows;

            if (dialog.datalist.filter.rows != rows) {
                dialog.datalist.filter.rows = rows;
                dialog.datalist.filter.page = 0;

                dialog.refresh();
            }
        },
        searchChanged: function (e) {
            var input = this;
            var dialog = MvcDatalistDialog.prototype.current;

            dialog.datalist.stopLoading();
            clearTimeout(dialog.searching);
            dialog.searching = setTimeout(function () {
                if (dialog.datalist.filter.search != input.value || e.keyCode == 13) {
                    dialog.datalist.filter.search = input.value;
                    dialog.datalist.filter.page = 0;

                    dialog.refresh();
                }
            }, dialog.datalist.options.searchDelay);
        }
    };

    return MvcDatalistDialog;
}());
var MvcDatalistOverlay = (function () {
    function MvcDatalistOverlay(dialog) {
        this.instance = this.getClosestOverlay(dialog.instance);
        this.dialog = dialog;

        this.bind();
    }

    MvcDatalistOverlay.prototype = {
        getClosestOverlay: function (element) {
            var overlay = element;
            while (overlay.parentNode && !overlay.classList.contains('datalist-overlay')) {
                overlay = overlay.parentNode;
            }

            if (overlay == document) {
                throw new Error('Datalist dialog has to be inside a datalist-overlay.');
            }

            return overlay;
        },

        show: function () {
            var body = document.body.getBoundingClientRect();
            if (body.left + body.right < window.innerWidth) {
                var paddingRight = parseFloat(getComputedStyle(document.body).paddingRight);
                document.body.style.paddingRight = (paddingRight + 17) + 'px';
            }

            document.body.classList.add('datalist-open');
            this.instance.style.display = 'block';
        },
        hide: function () {
            document.body.classList.remove('datalist-open');
            document.body.style.paddingRight = '';
            this.instance.style.display = '';
        },

        bind: function () {
            this.instance.removeEventListener('click', this.onClick);
            this.instance.addEventListener('click', this.onClick);
        },
        onClick: function (e) {
            var targetClasses = (e.target || e.srcElement).classList;

            if (targetClasses.contains('datalist-overlay') || targetClasses.contains('datalist-wrapper')) {
                MvcDatalistDialog.prototype.current.close();
            }
        }
    };

    return MvcDatalistOverlay;
}());
var MvcDatalistAutocomplete = (function () {
    function MvcDatalistAutocomplete(datalist) {
        this.instance = document.createElement('ul');
        this.instance.className = 'datalist-autocomplete';
        this.options = { minLength: 1, rows: 20 };
        this.activeItem = null;
        this.datalist = datalist;
        this.items = [];
    }

    MvcDatalistAutocomplete.prototype = {
        search: function (term) {
            var autocomplete = this;
            var datalist = autocomplete.datalist;

            datalist.stopLoading();
            clearTimeout(autocomplete.searching);
            autocomplete.searching = setTimeout(function () {
                if (term.length < autocomplete.options.minLength || datalist.readonly) {
                    autocomplete.hide();

                    return;
                }

                datalist.startLoading({ search: term, rows: autocomplete.options.rows }, function (data) {
                    autocomplete.clear();

                    data = data.Rows.filter(function (row) {
                        return !datalist.multi || datalist.indexOf(datalist.selected, row.DatalistIdKey) < 0;
                    });

                    for (var i = 0; i < data.length; i++) {
                        var item = document.createElement('li');
                        item.dataset.id = data[i].DatalistIdKey;
                        item.innerText = data[i].DatalistAcKey;

                        autocomplete.instance.appendChild(item);
                        autocomplete.bind(item, [data[i]]);
                        autocomplete.items.push(item);
                    }

                    if (data.length) {
                        autocomplete.show();
                    } else {
                        autocomplete.hide();
                    }
                });
            }, autocomplete.datalist.options.searchDelay);
        },
        previous: function () {
            if (!this.instance.parentNode) {
                this.search(this.datalist.search.value);

                return;
            }

            if (this.activeItem) {
                this.activeItem.classList.remove('active');

                this.activeItem = this.activeItem.previousSibling || this.items[this.items.length - 1];
                this.activeItem.classList.add('active');
            } else if (this.items.length) {
                this.activeItem = this.items[this.items.length - 1];
                this.activeItem.classList.add('active');
            }
        },
        next: function () {
            if (!this.instance.parentNode) {
                this.search(this.datalist.search.value);

                return;
            }

            if (this.activeItem) {
                this.activeItem.classList.remove('active');

                this.activeItem = this.activeItem.nextSibling || this.items[0];
                this.activeItem.classList.add('active');
            } else if (this.items.length) {
                this.activeItem = this.items[0];
                this.activeItem.classList.add('active');
            }
        },
        clear: function () {
            this.items = [];
            this.activeItem = null;
            this.instance.innerHTML = '';
        },
        show: function () {
            var search = this.datalist.search.getBoundingClientRect();

            this.instance.style.left = (search.left + window.pageXOffset) + 'px';
            this.instance.style.top = (search.top + search.height + window.pageYOffset) + 'px';

            document.body.appendChild(this.instance);
        },
        hide: function () {
            this.clear();

            if (this.instance.parentNode) {
                document.body.removeChild(this.instance);
            }
        },

        bind: function (item, data) {
            var autocomplete = this;
            var datalist = autocomplete.datalist;

            item.addEventListener('mousedown', function (e) {
                e.preventDefault();
            });

            item.addEventListener('click', function () {
                if (datalist.multi) {
                    datalist.select(datalist.selected.concat(data), true);
                } else {
                    datalist.select(data, true);
                }

                datalist.stopLoading();
                autocomplete.hide();
            });

            item.addEventListener('mouseenter', function () {
                if (autocomplete.activeItem) {
                    autocomplete.activeItem.classList.remove('active');
                }

                this.classList.add('active');
                autocomplete.activeItem = this;
            });
        }
    };

    return MvcDatalistAutocomplete;
}());
var MvcDatalist = (function () {
    function MvcDatalist(element, options) {
        var group = this.closestGroup(element);
        if (group.dataset.id) {
            return this.instances[parseInt(group.dataset.id)];
        }

        this.items = [];
        this.events = {};
        this.group = group;
        this.selected = [];
        this.for = group.dataset.for;
        this.url = group.dataset.url;
        this.multi = group.dataset.multi == 'true';
        this.group.dataset.id = this.instances.length;
        this.readonly = group.dataset.readonly == 'true';
        this.options = { searchDelay: 500, loadingDelay: 300 };

        this.search = group.querySelector('.datalist-input');
        this.browser = group.querySelector('.datalist-browser');
        this.control = group.querySelector('.datalist-control');
        this.error = group.querySelector('.datalist-control-error');
        this.valueContainer = group.querySelector('.datalist-values');
        this.values = this.valueContainer.querySelectorAll('.datalist-value');

        this.autocomplete = new MvcDatalistAutocomplete(this);
        this.filter = new MvcDatalistFilter(this);
        this.dialog = new MvcDatalistDialog(this);
        this.instances.push(this);
        this.set(options || {});

        this.reload(false);
        this.cleanUp();
        this.bind();
    }

    MvcDatalist.prototype = {
        instances: [],
        lang: {
            search: 'Search...',
            select: 'Select ({0})',
            noData: 'No data found',
            error: 'Error while retrieving records'
        },

        closestGroup: function (element) {
            var datalist = element;
            while (datalist.parentNode && !datalist.classList.contains('datalist')) {
                datalist = datalist.parentNode;
            }

            if (datalist == document) {
                throw new Error('Datalist can only be created from within datalist structure.');
            }

            return datalist;
        },

        extend: function () {
            var options = {};

            for (var i = 0; i < arguments.length; i++) {
                for (var key in arguments[i]) {
                    if (arguments[i].hasOwnProperty(key)) {
                        if (Object.prototype.toString.call(options[key]) == '[object Object]') {
                            options[key] = this.extend(options[key], arguments[i][key]);
                        } else {
                            options[key] = arguments[i][key];
                        }
                    }
                }
            }

            return options;
        },
        set: function (options) {
            this.autocomplete.options = this.extend(this.autocomplete.options, options.autocomplete);
            this.setReadonly(options.readonly == null ? this.readonly : options.readonly);
            this.dialog.options = this.extend(this.dialog.options, options.dialog);
            this.events = this.extend(this.events, options.events);
        },
        setReadonly: function (readonly) {
            this.readonly = readonly;

            if (readonly) {
                this.search.setAttribute('tabindex', -1);
                this.search.setAttribute('readonly', 'readonly');
                this.group.classList.add('datalist-readonly');

                if (this.browser) {
                    this.browser.setAttribute('tabindex', -1);
                }
            } else {
                this.search.removeAttribute('readonly');
                this.search.removeAttribute('tabindex');
                this.group.classList.remove('datalist-readonly');

                if (this.browser) {
                    this.browser.removeAttribute('tabindex');
                }
            }

            this.resizeSearch();
        },

        browse: function () {
            if (!this.readonly) {
                this.dialog.open();
            }
        },
        reload: function (triggerChanges) {
            var rows = [];
            var datalist = this;
            var originalValue = datalist.search.value;
            var ids = [].filter.call(datalist.values, function (element) { return element.value; });

            if (ids.length) {
                datalist.startLoading({ ids: ids, rows: ids.length }, function (data) {
                    for (var i = 0; i < ids.length; i++) {
                        var index = datalist.indexOf(data.Rows, ids[i].value);
                        if (index >= 0) {
                            rows.push(data.Rows[index]);
                        }
                    }

                    datalist.select(rows, triggerChanges);
                });
            } else {
                datalist.stopLoading();
                datalist.select(rows, triggerChanges);

                if (!datalist.multi && datalist.search.getAttribute('name')) {
                    datalist.search.value = originalValue;
                }
            }
        },
        select: function (data, triggerChanges) {
            var datalist = this;
            triggerChanges = triggerChanges == null || triggerChanges;

            if (datalist.events.select) {
                var e = new CustomEvent('select', { cancelable: true });

                datalist.events.select.apply(datalist, [e, data, triggerChanges]);

                if (e.defaultPrevented) {
                    return;
                }
            }

            if (triggerChanges && data.length == datalist.selected.length) {
                triggerChanges = false;
                for (var i = 0; i < data.length && !triggerChanges; i++) {
                    triggerChanges = data[i].DatalistIdKey != datalist.selected[i].DatalistIdKey;
                }
            }

            datalist.selected = data;

            if (datalist.multi) {
                datalist.search.value = '';
                datalist.valueContainer.innerHTML = '';;
                datalist.items.forEach(function (item) {
                    item.parentNode.removeChild(item);
                });

                datalist.items = datalist.createSelectedItems(data);
                datalist.items.forEach(function (item) {
                    datalist.control.insertBefore(item, datalist.search);
                });

                datalist.values = datalist.createValues(data);
                datalist.values.forEach(function (value) {
                    datalist.valueContainer.appendChild(value);
                });

                datalist.resizeSearch();
            } else if (data.length) {
                datalist.values[0].value = data[0].DatalistIdKey;
                datalist.search.value = data[0].DatalistAcKey;
            } else {
                datalist.values[0].value = '';
                datalist.search.value = '';
            }

            if (triggerChanges) {
                if (typeof (Event) === 'function') {
                    var change = new Event('change');
                } else {
                    var change = document.createEvent('Event');
                    change.initEvent('change', true, true);
                }

                datalist.search.dispatchEvent(change);
                [].forEach.call(datalist.values, function (value) {
                    value.dispatchEvent(change);
                });
            }
        },
        selectFirst: function (triggerChanges) {
            var datalist = this;

            datalist.startLoading({ rows: 1 }, function (data) {
                datalist.select(data.Rows, triggerChanges);
            });
        },
        selectSingle: function (triggerChanges) {
            var datalist = this;

            datalist.startLoading({ rows: 2 }, function (data) {
                if (data.Rows.length == 1) {
                    datalist.select(data.Rows, triggerChanges);
                } else {
                    datalist.select([], triggerChanges);
                }
            });
        },

        createSelectedItems: function (data) {
            var items = [];

            for (var i = 0; i < data.length; i++) {
                var button = document.createElement('button');
                button.className = 'datalist-deselect';
                button.innerText = '×';
                button.type = 'button';

                var item = document.createElement('div');
                item.innerText = data[i].DatalistAcKey || '';
                item.className = 'datalist-item';
                item.appendChild(button);
                items.push(item);

                this.bindDeselect(button, data[i].DatalistIdKey);
            }

            return items;
        },
        createValues: function (data) {
            var inputs = [];

            for (var i = 0; i < data.length; i++) {
                var input = document.createElement('input');
                input.className = 'datalist-value';
                input.setAttribute('type', 'hidden');
                input.setAttribute('name', this.for);
                input.value = data[i].DatalistIdKey;

                inputs.push(input);
            }

            return inputs;
        },

        startLoading: function (search, success, error) {
            var datalist = this;

            datalist.stopLoading();
            datalist.loading = setTimeout(function () {//todoz
                datalist.group.classList.add('datalist-loading');
            }, datalist.options.loadingDelay);
            datalist.group.classList.remove('datalist-error');

            datalist.request = new XMLHttpRequest();
            datalist.request.open('GET', datalist.filter.formUrl(search), true);

            datalist.request.onload = function () {
                if (200 <= datalist.request.status && datalist.request.status < 400) {
                    datalist.stopLoading();

                    success(JSON.parse(datalist.request.responseText))
                } else {
                    datalist.request.onerror();
                }
            };

            datalist.request.onerror = function () {
                datalist.error.setAttribute('title', datalist.lang.error);
                datalist.group.classList.add('datalist-error');
                datalist.stopLoading();

                if (error) {
                    error();
                }
            };

            datalist.request.send();
        },
        stopLoading: function () {
            if (this.request && this.request.readyState != 4) {
                this.request.abort();
            }

            clearTimeout(this.loading);
            this.group.classList.remove('datalist-loading');
        },

        bindDeselect: function (close, id) {
            var datalist = this;

            close.addEventListener('click', function () {
                datalist.select(datalist.selected.filter(function (value) { return value.DatalistIdKey != id; }), true);
                datalist.search.focus();
            });
        },
        indexOf: function (selection, id) {
            for (var i = 0; i < selection.length; i++) {
                if (selection[i].DatalistIdKey == id) {
                    return i;
                }
            }

            return -1;
        },
        resizeSearch: function () {
            if (this.items.length) {
                var style = getComputedStyle(this.control);
                var contentWidth = this.control.clientWidth;
                var lastItem = this.items[this.items.length - 1];
                contentWidth -= parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
                var widthLeft = Math.floor(contentWidth - lastItem.offsetLeft - lastItem.offsetWidth);

                if (widthLeft > contentWidth / 3) {
                    style = getComputedStyle(this.search);
                    widthLeft -= parseFloat(style.marginLeft) + parseFloat(style.marginRight) + 4;
                    this.search.style.width = widthLeft + 'px';
                } else {
                    this.search.style.width = '';
                }
            } else {
                this.search.style.width = '';
            }
        },
        cleanUp: function () {
            delete this.group.dataset.readonly;
            delete this.group.dataset.filters;
            delete this.group.dataset.dialog;
            delete this.group.dataset.search;
            delete this.group.dataset.multi;
            delete this.group.dataset.order;
            delete this.group.dataset.title;
            delete this.group.dataset.page;
            delete this.group.dataset.rows;
            delete this.group.dataset.sort;
            delete this.group.dataset.url;
        },
        bind: function () {
            var datalist = this;

            window.addEventListener('resize', function () {
                datalist.resizeSearch();
            });

            datalist.search.addEventListener('focus', function () {
                datalist.group.classList.add('datalist-focus');
            });

            datalist.search.addEventListener('blur', function () {
                datalist.stopLoading();
                datalist.autocomplete.hide();
                datalist.group.classList.remove('datalist-focus');

                var originalValue = this.value;
                if (!datalist.multi && datalist.selected.length) {
                    if (datalist.selected[0].DatalistAcKey != this.value) {
                        datalist.select([], true);
                    }
                } else {
                    this.value = '';
                }

                if (!datalist.multi && datalist.search.getAttribute('name')) {
                    this.value = originalValue;
                }
            });

            datalist.search.addEventListener('keydown', function (e) {
                if (e.which == 8 && !this.value.length && datalist.selected.length) {
                    datalist.select(datalist.selected.slice(0, -1), true);
                } else if (e.which == 38) {
                    e.preventDefault();

                    datalist.autocomplete.previous();
                } else if (e.which == 40) {
                    e.preventDefault();

                    datalist.autocomplete.next();
                } else if (e.which == 13 && datalist.autocomplete.activeItem) {
                    if (typeof (Event) === 'function') {
                        var click = new Event('click');
                    } else {
                        var click = document.createEvent('Event');
                        click.initEvent('click', true, true);
                    }

                    datalist.autocomplete.activeItem.dispatchEvent(click);
                }
            });
            datalist.search.addEventListener('input', function () {
                if (!this.value.length && !datalist.multi && datalist.selected.length) {
                    datalist.autocomplete.hide();
                    datalist.select([], true);
                }

                datalist.autocomplete.search(this.value);
            });

            if (datalist.browser) {
                datalist.browser.addEventListener('click', function () {
                    datalist.browse();
                });
            }

            for (var i = 0; i < datalist.filter.additionalFilters.length; i++) {
                var inputs = document.querySelectorAll('[name="' + datalist.filter.additionalFilters[i] + '"]');

                for (var j = 0; j < inputs.length; j++) {
                    inputs[j].addEventListener('change', function (e) {
                        datalist.stopLoading();

                        if (datalist.events.filterChange) {
                            datalist.events.filterChange.apply(datalist, [e]);
                        }

                        if (!e.defaultPrevented && datalist.selected.length) {
                            var rows = [];
                            var ids = [].filter.call(datalist.values, function (element) { return element.value; });

                            datalist.startLoading({ checkIds: ids, rows: ids.length }, function (data) {
                                for (var i = 0; i < ids.length; i++) {
                                    var index = datalist.indexOf(data.Rows, ids[i].value);
                                    if (index >= 0) {
                                        rows.push(data.Rows[index]);
                                    }
                                }

                                datalist.select(rows, true);
                            }, function () {
                                datalist.select(rows, true);
                            });
                        }
                    });
                }
            }
        }
    };

    return MvcDatalist;
}());
