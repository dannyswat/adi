(function (w, d, $) {

function resolveElement(source) {
    if (!source) return null;
    if (typeof source === 'string') {
        var ele = d.getElementById(source);
        if (!ele) ele = $(source).get(0);
        return ele;
    }
    else if (source.tagName)
        return source;
    else if ('jquery' in Object(source))
        return source.get(0);
}

function adGrid(container, opts) {

    function editButtonColumn(e) {
        e.cellElement.append($('<a href="#">Edit</a>'));
    }

    function updateButtonColumn(e) {

    }

    function deleteButtonColumn(e) {

    }

    function emptyColumn(e) {

    }

    function listData() {
        if (typeof apis.list === "function") opts.data = apis.list();
    }

    function insertData(data) {
        if (!opts.allowAdd) return;

        if (typeof apis.add === "function")  {
            data = apis.add(data);
            opts.data.push(data);
        }
    }

    function updateData(data) {
        if (!opts.allowUpdate) return;

        if (typeof (apis.update) === "function") {
            data = apis.update(data);
            var keyValue = data[opts.dataKey];

            for (var i in opts.data) {
                if (opts.data[i][opts.dataKey] === keyValue)
                    opts.data[i] = data;
            }
        }
    }

    function removeData(data) {
        if (!opts.allowRemove) return;

        if (typeof (apis.delete) === "function") {
            data = apis.delete(data);
            var keyValue = data[opts.dataKey];

            for (var i in opts.data) {
                if (opts.data[i][opts.dataKey] === keyValue) {

                }
            }
    }

    function render() {
        if (!opts.data) listData();

        $(gridElement).html('').append(createTable(opts.columns, opts.data));
    }

    function getColumnFromDataDefinition(defn) {
        return defn;
    }

    function createHeaders(cols) {
        var thead = $('<tr>');

        for (var i in cols) {
            thead.append($('<th class="header">').text(cols[i].caption || cols[i].name || ''));
        }

        return $('<thead>').append(thead);
    }

    function createRow(cols, rowData) {
        var trow = $('<tr>');
        
        for (var i in cols) {
            var cell = $('<td class="cell">');
            trow.append(cell);

            if (cols[i].cellTemplate) {
                cols[i].cellTemplate({
                    value: rowData[cols[i].name] || rowData,
                    component: this,
                    cellElement: cell
                });
            }
            else {
                cell.append($('<span>').text(rowData[cols[i].name]));
            } 
        }

        return trow;
    }

    function createTable(cols, data) {
        var table = $('<table>');
        table.append(createHeaders(cols));
        var tbody = $('<tbody>');
        table.append(tbody);

        for (var i in data) {
            tbody.append(createRow(cols, data[i]));
        }

        return table;
    }

    var functionColumns = {
        edit: { caption: '', cellTemplate: editButtonColumn, editCellTemplate: updateButtonColumn },
        delete: { caption: '', cellTemplate: deleteButtonColumn, editCellTemplate: emptyColumn }
    };

    function resolveColumn(col) {
        if (typeof col === "string") {
            if (col[0] === '#') {
                var key = col.substring(1);
                return functionColumns[key];
            }
            else {
                for (var i in defns)
                if (defns[i].name === col)
                    return getColumnFromDataDefinition(defns[i]);
                throw "Column '" + col + "' is not found in data definitions";
            }
        }
        else
            return col;
    }

    var gridElement = resolveElement(container);

    var defaultOpts = {
        dataDefinitions: [],
        columns: [],
        data: null,
        apis: {
            add: null,
            update: null,
            remove: null,
            list: null,
            get: null
        },
        dataKey: ''
    };

    opts = this.options = $.extend(defaultOpts, opts);
    var apis = opts.apis;
    var defns = opts.dataDefinitions;

    if (!apis.list && !this.options.data) throw "data or list api is not defined";
    opts.allowAdd = !!apis.add;
    opts.allowUpdate = !!apis.update && !!apis.get;
    opts.allowRemove = !!apis.remove;
    if (!opts.columns.length) throw "grid columns is not defined";


    for (var i in opts.columns)
        opts.columns[i] = resolveColumn(opts.columns[i]);

    this.render = render;

    render();
}
}
w.adGrid = adGrid;
}
)(window, document, window.jQuery);