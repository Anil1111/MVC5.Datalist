/*!
 * Datalist 5.4.0
 * https://github.com/NonFactors/MVC5.Datalist
 *
 * Copyright © NonFactors
 *
 * Licensed under the terms of the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */
var MvcDatalistFilter = (function () {
    function MvcDatalistFilter(group) {
        this.page = group.attr('data-page');
        this.rows = group.attr('data-rows');
        this.sort = group.attr('data-sort');
        this.order = group.attr('data-order');
        this.search = group.attr('data-search');
        this.additionalFilters = group.attr('data-filters').split(',').filter(Boolean);
    }

    MvcDatalistFilter.prototype = {
        getQuery: function (search) {
            var filter = $.extend({}, this, search);
            var query = '?search=' + encodeURIComponent(filter.search) +
                '&sort=' + encodeURIComponent(filter.sort) +
                '&order=' + encodeURIComponent(filter.order) +
                '&rows=' + encodeURIComponent(filter.rows) +
                '&page=' + encodeURIComponent(filter.page) +
                (filter.checkIds || '') +
                (filter.ids || '');

            for (var i = 0; i < this.additionalFilters.length; i++) {
                var filters = $('[name="' + this.additionalFilters[i] + '"]');
                for (var j = 0; j < filters.length; j++) {
                    query += '&' + encodeURIComponent(this.additionalFilters[i]) + '=' + encodeURIComponent(filters[j].value);
                }
            }

            return query;
        }
    };

    return MvcDatalistFilter;
}());
var MvcDatalistDialog = (function () {
    function MvcDatalistDialog(datalist) {
        this.datalist = datalist;
        this.filter = datalist.filter;
        this.title = datalist.group.attr('data-title');
        this.instance = $('#' + datalist.group.attr('data-dialog'));

        this.pager = this.instance.find('ul');
        this.table = this.instance.find('table');
        this.tableHead = this.instance.find('thead');
        this.tableBody = this.instance.find('tbody');
        this.error = this.instance.find('.datalist-error');
        this.search = this.instance.find('.datalist-search');
        this.rows = this.instance.find('.datalist-rows input');
        this.loader = this.instance.find('.datalist-dialog-loader');
        this.selector = this.instance.find('.datalist-selector button');

        this.initOptions();
    }

    MvcDatalistDialog.prototype = {
        set: function (options) {
            options = options || {};
            $.extend(this.options.dialog, options.dialog);
            $.extend(this.options.spinner, options.spinner);
            $.extend(this.options.resizable, options.resizable);
        },
        initOptions: function () {
            var dialog = this;

            dialog.options = {
                dialog: {
                    position: { my: 'center top', at: 'center top+50px', of: window, within: window },
                    classes: { 'ui-dialog': 'datalist-widget' },
                    dialogClass: 'datalist-widget',
                    title: dialog.title,
                    draggable: false,
                    autoOpen: false,
                    minWidth: 455,
                    width: 'auto',
                    modal: true
                },
                spinner: {
                    min: 1,
                    max: 99,
                    change: function () {
                        this.value = dialog.limitRows(this.value);
                        dialog.filter.rows = this.value;
                        dialog.filter.page = 0;

                        dialog.refresh();
                    }
                },
                resizable: {
                    handles: 'w,e',
                    stop: function () {
                        $(this).css('height', 'auto');
                    }
                }
            };
        },

        open: function () {
            var dialog = this;
            dialog.loader.hide();
            dialog.error.hide().html(dialog.lang('Error'));
            dialog.selected = dialog.datalist.selected.slice();
            dialog.rows.val(dialog.limitRows(dialog.filter.rows));
            dialog.search.attr('placeholder', dialog.lang('Search'));
            dialog.selector.parent().css('display', dialog.datalist.multi ? '' : 'none');
            dialog.filter.search = dialog.datalist.options.preserveSearch ? dialog.filter.search : '';
            dialog.selector.text(dialog.lang('Select').replace('{0}', dialog.datalist.selected.length));

            dialog.bind();
            dialog.refresh();
            dialog.search.val(dialog.filter.search);

            setTimeout(function () {
                if (dialog.loading) {
                    dialog.loader.show();
                }

                dialog.instance.dialog('open');
            }, 100);
        },
        close: function () {
            this.instance.dialog('close');
        },

        refresh: function () {
            var dialog = this;
            dialog.loading = true;
            dialog.error.fadeOut(300);
            var loading = setTimeout(function () {
                dialog.loader.fadeIn(300);
            }, 300);

            $.ajax({
                cache: false,
                url: dialog.datalist.url + dialog.filter.getQuery() + dialog.selected.map(function (x) { return '&selected=' + x.DatalistIdKey; }).join(''),
                success: function (data) {
                    dialog.loading = false;
                    clearTimeout(loading);
                    dialog.render(data);
                },
                error: function () {
                    dialog.loading = false;
                    clearTimeout(loading);
                    dialog.render();
                }
            });
        },

        render: function (data) {
            this.loader.fadeOut(300);
            this.tableHead.empty();
            this.tableBody.empty();
            this.pager.empty();

            if (data) {
                this.renderHeader(data.Columns);
                this.renderBody(data.Columns, data.Rows);
                this.renderFooter(data.FilteredRows);

                this.instance.parent().position({ my: 'left top', at: 'left top+50px', of: window, within: window });
                this.instance.dialog({
                    position: this.options.dialog.position || { my: 'center top', at: 'center top+50px', of: window, within: window }
                });
            } else {
                this.error.fadeIn(300);
            }
        },
        renderHeader: function (columns) {
            var tr = document.createElement('tr');
            var selection = document.createElement('th');

            for (var i = 0; i < columns.length; i++) {
                if (!columns[i].Hidden) {
                    tr.appendChild(this.createHeaderColumn(columns[i]));
                }
            }

            tr.appendChild(selection);
            this.tableHead.append(tr);
        },
        renderBody: function (columns, rows) {
            if (rows.length == 0) {
                var empty = this.createEmptyRow(columns);
                empty.children[0].innerHTML = this.lang('NoData');
                empty.className = 'datalist-empty';

                this.tableBody.append(empty);
            }

            var hasSplit = false;
            var hasSelection = rows.length && this.datalist.indexOf(this.selected, rows[0].DatalistIdKey) >= 0;

            for (var i = 0; i < rows.length; i++) {
                var tr = this.createDataRow(rows[i]);
                var selection = document.createElement('td');

                for (var j = 0; j < columns.length; j++) {
                    if (!columns[j].Hidden) {
                        var td = document.createElement('td');
                        td.className = columns[j].CssClass || '';
                        td.innerText = rows[i][columns[j].Key] || '';

                        tr.appendChild(td);
                    }
                }

                tr.appendChild(selection);

                if (!hasSplit && hasSelection && this.datalist.indexOf(this.selected, rows[i].DatalistIdKey) < 0) {
                    var separator = this.createEmptyRow(columns);
                    separator.className = 'datalist-split';
                    hasSplit = true;

                    this.tableBody.append(separator);
                }

                this.tableBody.append(tr);
            }
        },
        renderFooter: function (filteredRows) {
            this.totalRows = filteredRows + this.selected.length;
            var totalPages = Math.ceil(filteredRows / this.filter.rows);

            if (totalPages > 0) {
                var startingPage = Math.floor(this.filter.page / 5) * 5;

                if (totalPages > 5 && this.filter.page > 0) {
                    this.renderPage('&laquo', 0);
                    this.renderPage('&lsaquo;', this.filter.page - 1);
                }

                for (var i = startingPage; i < totalPages && i < startingPage + 5; i++) {
                    this.renderPage(i + 1, i);
                }

                if (totalPages > 5 && this.filter.page < totalPages - 1) {
                    this.renderPage('&rsaquo;', this.filter.page + 1);
                    this.renderPage('&raquo;', totalPages - 1);
                }
            } else {
                this.renderPage(1, 0);
            }
        },

        createDataRow: function (data) {
            var dialog = this;
            var datalist = this.datalist;
            var row = document.createElement('tr');
            if (datalist.indexOf(dialog.selected, data.DatalistIdKey) >= 0) {
                row.className = 'selected';
            }

            $(row).on('click.datalist', function () {
                var index = datalist.indexOf(dialog.selected, data.DatalistIdKey);
                if (index >= 0) {
                    if (datalist.multi) {
                        dialog.selected.splice(index, 1);

                        $(this).removeClass('selected');
                    }
                } else {
                    if (datalist.multi) {
                        dialog.selected.push(data);
                    } else {
                        dialog.selected = [data];
                    }

                    $(this).addClass('selected');
                }

                if (datalist.multi) {
                    dialog.selector.text(dialog.lang('Select').replace('{0}', dialog.selected.length));
                } else {
                    datalist.select(dialog.selected, true);

                    dialog.close();

                    datalist.search.focus();
                }
            });

            return row;
        },
        createEmptyRow: function (columns) {
            var row = document.createElement('tr');
            var td = document.createElement('td');
            row.appendChild(td);

            td.setAttribute('colspan', columns.length + 1);

            return row;
        },
        createHeaderColumn: function (column) {
            var header = document.createElement('th');
            header.innerText = column.Header || '';
            var filter = this.filter;
            var dialog = this;

            if (column.CssClass) {
                header.className = column.CssClass;
            }

            if (filter.sort == column.Key) {
                header.className += ' datalist-' + filter.order.toLowerCase();
            }

            $(header).on('click.datalist', function () {
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
        renderPage: function (text, value) {
            var content = document.createElement('span');
            var page = document.createElement('li');
            page.appendChild(content);
            content.innerHTML = text;
            var dialog = this;

            if (dialog.filter.page == value) {
                page.className = 'active';
            } else {
                $(content).on('click.datalist', function () {
                    var expectedPages = Math.ceil((dialog.totalRows - dialog.selected.length) / dialog.filter.rows);
                    if (value < expectedPages) {
                        dialog.filter.page = value;
                    } else {
                        dialog.filter.page = expectedPages - 1;
                    }

                    dialog.refresh();
                });
            }

            dialog.pager.append(page);
        },

        limitRows: function (value) {
            var spinner = this.options.spinner;

            return Math.min(Math.max(parseInt(value), spinner.min), spinner.max) || this.filter.rows;
        },

        lang: function (key) {
            return $.fn.datalist.lang[key];
        },
        bind: function () {
            var timeout;
            var dialog = this;

            dialog.instance.dialog().dialog('destroy');
            dialog.instance.dialog(dialog.options.dialog);
            dialog.instance.dialog('option', 'close', function () {
                if (dialog.datalist.multi) {
                    dialog.datalist.select(dialog.selected, true);
                    dialog.datalist.search.focus();
                }
            });

            dialog.instance.parent().resizable().resizable('destroy');
            dialog.instance.parent().resizable(dialog.options.resizable);

            dialog.search.off('keyup.datalist').on('keyup.datalist', function (e) {
                var input = this;
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    if (dialog.filter.search != input.value || e.keyCode == 13) {
                        dialog.filter.search = input.value;
                        dialog.filter.page = 0;

                        dialog.refresh();
                    }
                }, 500);
            });

            dialog.rows.spinner().spinner('destroy');
            dialog.rows.spinner(dialog.options.spinner);
            dialog.rows.off('keyup.datalist').on('keyup.datalist', function (e) {
                if (e.which == 13) {
                    this.blur();
                    this.focus();
                }
            });

            dialog.selector.off('click.datalist').on('click.datalist', function () {
                dialog.close();
            });
        }
    };

    return MvcDatalistDialog;
}());
var MvcDatalist = (function () {
    function MvcDatalist(group, options) {
        this.readonly = group.attr('data-readonly') == 'true';
        this.multi = group.attr('data-multi') == 'true';
        this.filter = new MvcDatalistFilter(group);
        this.for = group.attr('data-for');
        this.url = group.attr('data-url');
        this.selected = [];

        this.browse = $('.datalist-browse[data-for="' + this.for + '"]');
        this.valueContainer = $('.datalist-values[data-for="' + this.for + '"]');
        this.values = this.valueContainer.find('.datalist-value');
        this.control = group.find('.datalist-control');
        this.search = group.find('.datalist-input');
        this.group = group;

        this.dialog = new MvcDatalistDialog(this);
        this.initOptions();
        this.set(options);

        this.methods = { reload: this.reload, browse: this.open };
        this.reload(false);
        this.cleanUp();
        this.bind();
    }

    MvcDatalist.prototype = {
        set: function (options) {
            options = options || {};

            this.options.preserveSearch = options.preserveSearch == null ? this.options.preserveSearch : options.preserveSearch;
            this.search.autocomplete($.extend(this.options.autocomplete, options.autocomplete));
            this.setReadonly(options.readonly == null ? this.readonly : options.readonly);
            this.events = $.extend(this.events, options.events);
            this.dialog.set(options);
        },
        initOptions: function () {
            var datalist = this;

            this.options = {
                preserveSearch: true,
                autocomplete: {
                    source: function (request, response) {
                        $.ajax({
                            url: datalist.url + datalist.filter.getQuery({ search: request.term, rows: 20 }),
                            success: function (data) {
                                response($.grep(data.Rows, function (row) {
                                    return !datalist.multi || datalist.indexOf(datalist.selected, row.DatalistIdKey) < 0;
                                }).map(function (row) {
                                    return {
                                        label: row.DatalistAcKey,
                                        value: row.DatalistAcKey,
                                        data: row
                                    };
                                }));
                            },
                            error: function () {
                                datalist.stopLoading();
                            }
                        });
                    },
                    search: function () {
                        datalist.startLoading(300);
                    },
                    response: function () {
                        datalist.stopLoading();
                    },
                    select: function (e, selection) {
                        if (datalist.multi) {
                            datalist.select(datalist.selected.concat(selection.item.data), true);
                        } else {
                            datalist.select([selection.item.data], true);
                        }

                        e.preventDefault();
                    },
                    minLength: 1,
                    delay: 500
                }
            };
        },
        setReadonly: function (readonly) {
            this.readonly = readonly;

            if (readonly) {
                this.search.autocomplete('disable').attr({ readonly: 'readonly', tabindex: -1 });
                this.group.addClass('datalist-readonly');
            } else {
                this.search.autocomplete('enable').removeAttr('readonly').removeAttr('tabindex');
                this.group.removeClass('datalist-readonly');
            }

            this.resizeDatalistSearch();
        },

        open: function () {
            if (!this.readonly) {
                this.dialog.open();
            }
        },
        reload: function (triggerChanges) {
            var datalist = this;
            triggerChanges = triggerChanges == null || triggerChanges;
            var ids = $.grep(datalist.values, function (e) { return e.value; });

            if (ids.length > 0) {
                datalist.startLoading(300);
                var encodedIds = ids.map(function (e) { return encodeURIComponent(e.value); });

                $.ajax({
                    url: datalist.url + datalist.filter.getQuery({ ids: '&ids=' + encodedIds.join('&ids='), rows: ids.length }),
                    cache: false,
                    success: function (data) {
                        datalist.stopLoading();

                        var rows = [];
                        for (var i = 0; i < ids.length; i++) {
                            var index = datalist.indexOf(data.Rows, ids[i].value);
                            if (index >= 0) {
                                rows.push(data.Rows[index]);
                            }
                        }

                        datalist.select(rows, triggerChanges);
                    },
                    error: function () {
                        datalist.stopLoading();
                    }
                });
            } else {
                datalist.select([], triggerChanges);
            }
        },
        select: function (data, triggerChanges) {
            if (this.events.select) {
                var e = $.Event('select.datalist');
                this.events.select.apply(this, [e, data, triggerChanges]);

                if (e.isDefaultPrevented()) {
                    return;
                }
            }

            if (triggerChanges && data.length == this.selected.length) {
                triggerChanges = false;
                for (var i = 0; i < data.length && !triggerChanges; i++) {
                    triggerChanges = data[i].DatalistIdKey != this.selected[i].DatalistIdKey;
                }
            }

            this.selected = data;

            if (this.multi) {
                this.search.val('');
                this.values.remove();
                this.control.find('.datalist-item').remove();
                this.createSelectedItems(data).insertBefore(this.search);

                this.values = this.createValues(data);
                this.valueContainer.append(this.values);
                this.resizeDatalistSearch();
            } else if (data.length > 0) {
                this.values.val(data[0].DatalistIdKey);
                this.search.val(data[0].DatalistAcKey);
            } else {
                this.values.val('');
                this.search.val('');
            }

            if (triggerChanges) {
                this.search.change();
                this.values.change();
            }
        },

        createSelectedItems: function (data) {
            var items = [];

            for (var i = 0; i < data.length; i++) {
                var close = document.createElement('span');
                close.className = 'datalist-close';
                close.innerHTML = 'x';

                var item = document.createElement('div');
                item.innerText = data[i].DatalistAcKey || '';
                item.className = 'datalist-item';
                item.appendChild(close);

                this.bindDeselect($(close), data[i].DatalistIdKey);

                items[i] = item;
            }

            return $(items);
        },
        createValues: function (data) {
            var inputs = [];

            for (var i = 0; i < data.length; i++) {
                var input = document.createElement('input');
                input.setAttribute('type', 'hidden');
                input.setAttribute('name', this.for);
                input.className = 'datalist-value';
                input.value = data[i].DatalistIdKey;

                inputs[i] = input;
            }

            return $(inputs);
        },

        startLoading: function (delay) {
            this.loading = setTimeout(function (datalist) {
                datalist.search.addClass('datalist-loading');
            }, delay, this);
        },
        stopLoading: function () {
            clearTimeout(this.loading);
            this.search.removeClass('datalist-loading');
        },

        bindDeselect: function (close, id) {
            var datalist = this;

            close.on('click.datalist', function () {
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
        resizeDatalistSearch: function () {
            var total = this.control.width();
            var lastItem = this.control.find('.datalist-item:last');

            if (lastItem.length > 0) {
                var widthLeft = Math.floor(total - lastItem.position().left - lastItem.outerWidth(true));

                if (widthLeft > total / 3) {
                    this.search.outerWidth(widthLeft, true);
                } else {
                    this.search.css('width', '');
                }
            } else {
                this.search.css('width', '');
            }
        },
        cleanUp: function () {
            this.group.removeAttr('data-readonly');
            this.group.removeAttr('data-filters');
            this.group.removeAttr('data-dialog');
            this.group.removeAttr('data-search');
            this.group.removeAttr('data-multi');
            this.group.removeAttr('data-order');
            this.group.removeAttr('data-title');
            this.group.removeAttr('data-page');
            this.group.removeAttr('data-rows');
            this.group.removeAttr('data-sort');
            this.group.removeAttr('data-url');
        },
        bind: function () {
            var datalist = this;

            $(window).on('resize.datalist', function () {
                datalist.resizeDatalistSearch();
            });

            datalist.search.on('keydown.datalist', function (e) {
                if (e.which == 8 && this.value.length == 0 && datalist.selected.length > 0) {
                    datalist.select(datalist.selected.slice(0, -1), true);
                }
            });
            datalist.search.on('keyup.datalist', function (e) {
                if (!datalist.multi && e.which != 9 && this.value.length == 0 && datalist.selected.length > 0) {
                    datalist.select([], true);
                }
            });
            datalist.search.on('blur.datalist', function () {
                if (datalist.multi) {
                    this.value = '';
                } else {
                    this.value = datalist.selected[0].DatalistAcKey;
                }
            });

            datalist.browse.on('click.datalist', function () {
                datalist.open();
            });

            var filters = datalist.filter.additionalFilters;
            for (var i = 0; i < filters.length; i++) {
                $('[name="' + filters[i] + '"]').on('change.datalist', function (e) {
                    if (datalist.events.filterChange) {
                        datalist.events.filterChange.apply(datalist, [e]);
                    }

                    if (!e.isDefaultPrevented() && datalist.selected.length > 0) {
                        datalist.startLoading(300);
                        var ids = $.grep(datalist.values, function (e) { return e.value; });
                        var encodedIds = ids.map(function (e) { return encodeURIComponent(e.value); });

                        $.ajax({
                            url: datalist.url + datalist.filter.getQuery({ checkIds: '&checkIds=' + encodedIds.join('&checkIds='), rows: ids.length }),
                            cache: false,
                            success: function (data) {
                                datalist.stopLoading();

                                var rows = [];
                                for (var i = 0; i < ids.length; i++) {
                                    var index = datalist.indexOf(data.Rows, ids[i].value);
                                    if (index >= 0) {
                                        rows.push(data.Rows[index]);
                                    }
                                }

                                datalist.select(rows, true);
                            },
                            error: function () {
                                datalist.select([], true);
                                datalist.stopLoading();
                            }
                        });
                    }
                });
            }
        }
    };

    return MvcDatalist;
}());

$.fn.datalist = function (options) {
    var args = arguments;

    return this.each(function () {
        var group = $(this).closest('.datalist');
        if (!group.length)
            return;

        if (!$.data(group[0], 'mvc-datalist')) {
            if (typeof options == 'string') {
                var datalist = new MvcDatalist(group);
                datalist.methods[options].apply(datalist, [].slice.call(args, 1));
            } else {
                var datalist = new MvcDatalist(group, options);
            }

            $.data(group[0], 'mvc-datalist', datalist);
        } else {
            var datalist = $.data(group[0], 'mvc-datalist');

            if (typeof options == 'string') {
                datalist.methods[options].apply(datalist, [].slice.call(args, 1));
            } else if (options) {
                datalist.set(options);
            }
        }
    });
};

$.fn.datalist.lang = {
    Error: 'Error while retrieving records',
    NoData: 'No data found',
    Select: 'Select ({0})',
    Search: 'Search...'
};
