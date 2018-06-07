/*!
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
        this.page = group.dataset.page;
        this.rows = group.dataset.rows;
        this.sort = group.dataset.sort;
        this.order = group.dataset.order;
        this.search = group.dataset.search;
        this.additionalFilters = group.dataset.filters.split(',').filter(Boolean);
    }

    MvcDatalistFilter.prototype = {
        formUrl: function (search) {
            var filter = this.datalist.extend({ ids: [], checkIds: [], selected: [] }, this, search);
            var query = '?search=' + encodeURIComponent(filter.search);

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

            return this.datalist.url + query;
        }
    };

    return MvcDatalistFilter;
}());
var MvcDatalistDialog = (function () {
    function MvcDatalistDialog(datalist) {
        this.datalist = datalist;
        this.title = datalist.group.dataset.title;
        this.options = { preserveSearch: true, rows: { min: 1, max: 99 } };
        this.instance = document.getElementById(datalist.group.dataset.dialog);

        this.pager = this.instance.querySelector('ul');
        this.table = this.instance.querySelector('table');
        this.tableHead = this.instance.querySelector('thead');
        this.tableBody = this.instance.querySelector('tbody');
        this.error = this.instance.querySelector('.datalist-error');
        this.header = this.instance.querySelector('.datalist-title');
        this.search = this.instance.querySelector('.datalist-search');
        this.rows = this.instance.querySelector('.datalist-rows input');
        this.closeButton = this.instance.querySelector('.datalist-close');
        this.loader = this.instance.querySelector('.datalist-dialog-loader');
        this.selector = this.instance.querySelector('.datalist-selector button');
    }

    MvcDatalistDialog.prototype = {
        lang: {
            search: 'Search...',
            select: 'Select ({0})',
            noData: 'No data found',
            error: 'Error while retrieving records'
        },

        open: function () {
            var dialog = this;
            var filter = dialog.datalist.filter;
            MvcDatalistDialog.prototype.current = this;

            dialog.error.style.display = 'none';
            dialog.loader.style.display = 'none';
            dialog.header.innerText = dialog.title;
            dialog.error.innerHTML = dialog.lang['error'];
            dialog.selected = dialog.datalist.selected.slice();
            dialog.rows.value = dialog.limitRows(filter.rows);
            dialog.search.setAttribute('placeholder', dialog.lang['search']);
            filter.search = dialog.options.preserveSearch ? filter.search : '';
            dialog.selector.parentNode.style.display = dialog.datalist.multi ? '' : 'none';
            dialog.selector.innerText = dialog.lang['select'].replace('{0}', dialog.datalist.selected.length);

            dialog.bind();
            dialog.refresh();
            dialog.search.value = filter.search;

            setTimeout(function () {
                if (dialog.loading) {
                    dialog.loader.style.opacity = 1;
                    dialog.loader.style.display = '';
                }

                if (document.body.scrollHeight != document.body.scrollHeight) {
                    var paddingRight = parseFloat(getComputedStyle(document.body).paddingRight);
                    document.body.style.paddingRight = (paddingRight + 17) + 'px';
                }

                document.body.classList.add('datalist-open');
            }, 100);
        },
        close: function () {
            document.body.classList.remove('datalist-open');
            var dialog = MvcDatalistDialog.prototype.current;

            if (dialog.datalist.multi) {
                dialog.datalist.select(dialog.selected, true);
                dialog.datalist.search.focus();
            }

            MvcDatalistDialog.prototype.current = null;
        },
        refresh: function () {
            var dialog = this;
            dialog.loading = true;
            dialog.error.style.opacity = 0;
            dialog.error.style.display = '';
            dialog.loader.style.display = '';
            var loading = setTimeout(function () {
                dialog.loader.style.opacity = 1;
            }, 300);

            dialog.datalist.load({ selected: dialog.selected }, function (data) {
                dialog.loading = false;
                clearTimeout(loading);
                dialog.render(data);
            }, function () {
                dialog.loading = false;
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
            }, 300);

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
            var selection = document.createElement('th');

            for (var i = 0; i < columns.length; i++) {
                if (!columns[i].Hidden) {
                    row.appendChild(this.createHeaderColumn(columns[i]));
                }
            }

            row.appendChild(selection);
            this.tableHead.appendChild(row);
        },
        renderBody: function (columns, rows) {
            if (rows.length == 0) {
                var empty = document.createElement('td');
                var row = document.createElement('tr');
                empty.innerHTML = this.lang['noData'];

                empty.setAttribute('colspan', columns.length + 1);
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
                    separator.className = 'datalist-split';
                    var empty = document.createElement('td');
                    separator.appendChild(empty);

                    empty.setAttribute('colspan', columns.length + 1);
                    this.tableBody.appendChild(separator);

                    hasSplit = true;
                }

                this.tableBody.appendChild(row);
            }
        },
        renderFooter: function (FilteredRows) {
            var dialog = this;
            var filter = dialog.datalist.filter;
            var totalPages = Math.ceil(FilteredRows / filter.rows);
            dialog.totalRows = FilteredRows + dialog.selected.length;

            if (totalPages > 0) {
                var startingPage = Math.floor(filter.page / 4) * 4;

                if (0 < filter.page && 4 < totalPages) {
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
            var content = document.createElement('a');
            var page = document.createElement('li');
            content.setAttribute('href', '#');
            var filter = this.datalist.filter;
            page.appendChild(content);
            content.innerHTML = text;
            var dialog = this;

            if (filter.page == value) {
                page.className = 'active';
            }

            content.addEventListener('click', function (e) {
                e.preventDefault();

                if (filter.page == value) {
                    return;
                }

                var expectedPages = Math.ceil((dialog.totalRows - dialog.selected.length) / filter.rows);
                if (value < expectedPages) {
                    filter.page = value;
                } else {
                    filter.page = expectedPages - 1;
                }

                dialog.refresh();
            });

            dialog.pager.appendChild(page);
        },

        createHeaderColumn: function (column) {
            var header = document.createElement('th');
            header.innerText = column.Header || '';
            var filter = this.datalist.filter;
            var dialog = this;

            if (column.CssClass) {
                header.className = column.CssClass;
            }

            if (filter.sort == column.Key) {
                header.className += ' datalist-' + filter.order.toLowerCase();
            }

            header.addEventListener('click', function () {
                if (filter.sort == column.Key) {
                    filter.order = filter.order == 'Asc' ? 'Desc' : 'Asc';
                } else {
                    filter.order = 'Asc';
                }

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
                    dialog.selector.innerText = dialog.lang['select'].replace('{0}', dialog.selected.length);
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

            this.value = dialog.limitRows(this.value);
            dialog.datalist.filter.rows = this.value;
            dialog.datalist.filter.page = 0;

            dialog.refresh();
        },
        searchChanged: function (e) {
            var input = this;
            var dialog = MvcDatalistDialog.prototype.current;

            clearTimeout(dialog.searching);
            dialog.searching = setTimeout(function () {
                if (dialog.datalist.filter.search != input.value || e.keyCode == 13) {
                    dialog.datalist.filter.search = input.value;
                    dialog.datalist.filter.page = 0;

                    dialog.refresh();
                }
            }, 500);
        }
    };

    return MvcDatalistDialog;
}());
var MvcDatalistAutocomplete = (function () {
    function MvcDatalistAutocomplete(datalist) {
        this.instance = document.querySelector('.datalist-autocomplete');
        this.options = { minLength: 1, delay: 500 };
        this.activeItem = null;
        this.datalist = datalist;
        this.items = [];
    }

    MvcDatalistAutocomplete.prototype = {
        search: function (term) {
            var autocomplete = this;
            var datalist = autocomplete.datalist;

            clearTimeout(autocomplete.searching);
            autocomplete.searching = setTimeout(function () {
                if (term.length < autocomplete.options.minLength || datalist.readonly) {
                    return;
                }

                datalist.load({ search: term, rows: 20 }, function (data) {
                    autocomplete.clear();

                    data = data.Rows.filter(function (row) {
                        return !datalist.multi || datalist.indexOf(datalist.selected, row.DatalistIdKey) < 0;
                    });

                    for (var i = 0; i < data.length; i++) {
                        var item = document.createElement('li');
                        item.dataset.id = data[i].DatalistIdKey;
                        item.innerText = data[i].DatalistAcKey;

                        autocomplete.instance.appendChild(item);
                        autocomplete.bind(item, data[i]);
                        autocomplete.items.push(item);
                    }

                    if (data.length) {
                        autocomplete.show();
                    } else {
                        autocomplete.hide();
                    }
                });
            }, autocomplete.options.delay);
        },
        previous: function () {
            if (!this.instance.style.display) {
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
            if (!this.instance.style.display) {
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

            this.instance.style.display = 'block';
        },
        hide: function () {
            this.clear();
            this.instance.style.display = '';
        },

        bind: function (item, data) {
            var autocomplete = this;
            var datalist = autocomplete.datalist;

            item.addEventListener('mousedown', function (e) {
                e.preventDefault();
            });

            item.addEventListener('click', function (e) {
                e.preventDefault();

                if (datalist.multi) {
                    datalist.select(datalist.selected.concat(data), true);
                } else {
                    datalist.select([data], true);
                }

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

        this.search = group.querySelector('.datalist-input');
        this.browser = group.querySelector('.datalist-browser');
        this.control = group.querySelector('.datalist-control');
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
                        options[key] = arguments[i][key];
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
            } else {
                this.search.removeAttribute('readonly');
                this.search.removeAttribute('tabindex');
                this.group.classList.remove('datalist-readonly');
            }

            this.resizeSearch();
        },

        load: function (search, success, error) {
            var datalist = this;
            datalist.startLoading(300);

            var request = new XMLHttpRequest();
            request.open('GET', datalist.filter.formUrl(search), true);

            request.onload = function () {
                datalist.stopLoading();

                if (200 <= request.status && request.status < 400) {
                    success(JSON.parse(request.responseText))
                } else {
                    request.onerror();
                }
            };

            request.onerror = function () {
                datalist.stopLoading();

                if (error) {
                    error();
                }
            };

            request.send();
        },

        browse: function () {
            if (!this.readonly) {
                this.dialog.open();
            }
        },
        reload: function (triggerChanges) {
            var rows = [];
            var datalist = this;
            var ids = [].filter.call(datalist.values, function (element) { return element.value; });

            if (ids.length) {
                datalist.load({ ids: ids, rows: ids.length }, function (data) {
                    for (var i = 0; i < ids.length; i++) {
                        var index = datalist.indexOf(data.Rows, ids[i].value);
                        if (index >= 0) {
                            rows.push(data.Rows[index]);
                        }
                    }

                    datalist.select(rows, triggerChanges);
                });
            } else {
                datalist.select(rows, triggerChanges);
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
            } else if (data.length > 0) {
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

            datalist.load({ rows: 1 }, function (data) {
                datalist.select(data.Rows, triggerChanges);
            });
        },
        selectSingle: function (triggerChanges) {
            var datalist = this;

            datalist.load({ rows: 2 }, function (data) {
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
                var close = document.createElement('span');
                close.className = 'datalist-deselect';
                close.innerHTML = 'x';

                var item = document.createElement('div');
                item.innerText = data[i].DatalistAcKey || '';
                item.className = 'datalist-item';
                item.appendChild(close);
                items.push(item);

                this.bindDeselect(close, data[i].DatalistIdKey);
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

        startLoading: function (delay) {
            this.stopLoading();

            this.loading = setTimeout(function (datalist) {
                datalist.search.classList.add('datalist-loading');
            }, delay, this);
        },
        stopLoading: function () {
            clearTimeout(this.loading);
            this.search.classList.remove('datalist-loading');
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
            if (this.items.length > 0) {
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

            datalist.group.addEventListener('focusin', function () {
                this.classList.add('datalist-focus');
            });

            datalist.group.addEventListener('focusout', function () {
                this.classList.remove('datalist-focus');
            });

            datalist.search.addEventListener('keydown', function (e) {
                if (e.which == 8 && this.value.length == 0 && datalist.selected.length > 0) {
                    datalist.select(datalist.selected.slice(0, -1), true);
                } else if (e.which == 38) {
                    datalist.autocomplete.previous();

                    e.preventDefault();
                } else if (e.which == 40) {
                    datalist.autocomplete.next();

                    e.preventDefault();
                } else if (e.which == 13 && datalist.autocomplete.activeItem) {
                    if (typeof (Event) === 'function') {
                        var click = new Event('click');
                    } else {
                        var click = document.createEvent('Event');
                        click.initEvent('click', true, true);
                    }

                    datalist.autocomplete.activeItem.dispatchEvent(click);

                    e.preventDefault();
                }
            });
            datalist.search.addEventListener('keyup', function (e) {
                if (e.which != 9 && this.value.length == 0 && !datalist.multi && datalist.selected.length > 0) {
                    datalist.autocomplete.hide();
                    datalist.select([], true);
                } else if (e.which != 13 && e.which != 38 && e.which != 40) {
                    datalist.autocomplete.search(this.value);
                }
            });
            datalist.search.addEventListener('input', function (e) {
                datalist.autocomplete.search(this.value);
            });
            datalist.search.addEventListener('blur', function () {
                if (!datalist.multi && datalist.selected.length) {
                    this.value = datalist.selected[0].DatalistAcKey;
                } else {
                    this.value = '';
                }

                datalist.autocomplete.hide();
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
                        if (datalist.events.filterChange) {
                            datalist.events.filterChange.apply(datalist, [e]);
                        }

                        if (!e.defaultPrevented && datalist.selected.length > 0) {
                            var rows = [];
                            var ids = [].filter.call(datalist.values, function (element) { return element.value; });

                            datalist.load({ checkIds: ids, rows: ids.length }, function (data) {
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

window.addEventListener('load', function () {
    document.querySelector('body > .datalist-overlay').addEventListener('click', function (e) {
        var target = e.target || e.srcElement;

        if (target.classList.contains('datalist-overlay')) {
            MvcDatalistDialog.prototype.current.close();
        }
    });
});
