function SchemaUI() {
    var $;
    var schemaKey = 'schema', dataKey = 'formData', statusKey = 'status', nameKey = 'name';
    var arrayFuncs = {
        createViews: function (e) {
            var count = e.data ? e.data.length : 0;
            if (e.status === 'c') count++; 
            var arrayContainer = div('sui-array').appendTo(e.element).data(schemaKey, e.schema);
            for (var i = 0; i < count; i++) {
                renderItems(e.root, div('sui-group').appendTo(arrayContainer), e.schema.items, e.data ? e.data[i] : null, e.status);
            }
            return arrayContainer;
        },
        createInputs: function (e) {
            var arrayContainer = arrayFuncs.createViews(e);
            $('<button>').text('+').data('root', e.root).on('click', addArrayItem).appendTo(arrayContainer);
            arrayContainer.children('.sui-group').each(function () { appendArrayItemButtons($(this)); });
            return arrayContainer;
        },
        readInputs: function (e) {
            
        }
    };

    var groupFuncs = {
        createViews: function (e) {
            return groupFuncs.createInputs(e);
        },
        createInputs: function (e) {
            var groupContainer = div('sui-group').appendTo(e.element);
            renderItems(e.root, groupContainer, e.schema.items, e.data, e.status);
            return groupContainer;
        },
        readInputs: function (e) {

        }
    };

    var dataTypes = {
        'string': { inputFunc: '*', readFunc: '*', viewFunc: '*' },
        'number': { inputFunc: '', readFunc: '', viewFunc: '' },
        'boolean': { inputFunc: '', readFunc: '', viewFunc: '' },
        'date': { inputFunc: '', readFunc: '', viewFunc: '' },
        'multiple': { inputFunc: '', readFunc: '', viewFunc: '' },
        'options': { inputFunc: '', readFunc: '', viewFunc: '' },
        'group': { inputFunc: '', readFunc: '', viewFunc: '' },
        'array': { }
    };

    var inputLibrary = {
        '*': function (e) {
            var input = $('<input type="text" class="sui-text" />');
            e.element.append(input);
            input.val(e.data);
            if (e.setting.placeholder) input.attr('placeholder', setting.placeholder);
            if (e.setting.width) input.width(e.setting.width);
            if (e.setting.className) input.addClass(e.setting.className);
            return input;
        },
        'array': arrayFuncs.createInputs
    };

    var viewLibrary = {
        '*' : function (e) {
            var span = $('<span>').text(e.data);
            e.element.append(span);
            if (e.setting.className) input.addClass(e.setting.className);
        },
        'array': arrayFuncs.createViews
    };

    var readLibrary = {
        '*': function (e) {
            var value = e.element.find('input').val();
            if (e.setting.required && $.trim(value) === '')
                e.setError(e.setting.requiredMessage || (e.schema.caption + ' is required'));
            else if (e.setting.pattern && !e.setting.pattern.test(value))
                e.setError(e.setting.patternMessage || (e.schema.caption + ' is not in correct format'));
            else if (e.setting.maxLength && value.length > e.setting.maxLength)
                e.setError(e.setting.lengthMessage || (e.schema.caption + ' exceeds maximum length ' + e.setting.maxLength));
            else if (e.setting.minLength && value.length < e.setting.minLength)
                e.setError(e.setting.lengthMessage || (e.schema.caption + ' requires at least length of ' + e.setting.minLength));
            return value;
        }
    };

    var animateLibrary = {
        'moveup': function (element, callback) {
            if (callback) callback.call(this);
        },
        'movedown': function (element, callback) {
            if (callback) callback.call(this);
        },
        'remove': function (element, callback) {
            if (callback) callback.call(this);
        },
        'add': function (element, callback) {
            element.hide().slideDown(300);
            if (callback) callback.call(this);
        }
    }

    function init() {
        if (!window.jQuery) throw 'Require jQuery to render';
        $ = window.jQuery;
        $.fn.firstOrDefault = function () { return this.length > 0 ? this.first() : null; }
    }

    function appendArrayItemButtons(groupContainer) {
        $('<button>').text('-').on('click', removeArrayItem).appendTo(groupContainer);
        $('<button>').text('Up').on('click', moveUpArrayItem).appendTo(groupContainer);
        $('<button>').text('Down').on('click', moveDownArrayItem).appendTo(groupContainer);
    }

    function addArrayItem(e) {
        var divGroup = div('sui-group').appendTo($(this).parent());
        renderItems($(this).data('root'), divGroup, $(this).parent().parent().data(schemaKey).items, null, 'c');
        $(this).appendTo($(this).parent());
        appendArrayItemButtons(divGroup);
        animateLibrary.add.call(this, divGroup);
    }

    function removeArrayItem(e) {
        animateLibrary.remove.call(this, $(this).parent(), function () {
            $(this).parent().remove();
        });
    }

    function moveUpArrayItem(e) {
        animateLibrary.moveup.call(this, $(this).parent(), function () {
            $(this).parent().prev('.sui-group').before($(this).parent());
        });
    }

    function moveDownArrayItem(e) {
        animateLibrary.movedown.call(this, $(this).parent(), function () {
            $(this).parent().next('.sui-group').after($(this).parent());
        });
    }

    function div(className) {
        return $('<div>').addClass('sui').addClass(className);
    }

    function caption(text, required) {
        return $('<span>').addClass('sui-caption' + (required ? ' sui-required' : '')).text(text + ': ');
    }

    function showTab() {
        $(this).parent().parent().children('.sui-tabcontent').hide();
        $(this).parent().children().removeClass('active');
        $(this).addClass('active').data('tabContent').show();
    }

    function renderItem(rootContainer, itemContainer, itemSchema, itemData, status) {
        var itemType = dataTypes[itemSchema.type];
        if (!itemType) throw 'Invalid data type';

        var event = {
            element: itemContainer,
            schema: itemSchema,
            data: itemData,
            setting: itemSchema.setting || {},
            needCaption: true,
            root: rootContainer,
            status: status
        };
        var func;

        switch (status) {
            case 'c':
            case 'u':
                func = inputLibrary[itemSchema.inputFunc || itemType.inputFunc || itemSchema.type] || inputLibrary['*'];
                event.createInputs = inputLibrary;
                break;
            case 'v':
                func = viewLibrary[itemSchema.viewFunc || itemType.viewFunc || itemSchema.type] || viewLibrary['*'];
                event.createViews = viewLibrary;
                break;
        }
        if (typeof func !== 'function') throw 'Invalid function';

        itemContainer.addClass(itemSchema.type).data(schemaKey, itemSchema);

        func(event);

        if (event.needCaption) itemContainer.prepend(caption(event.schema.caption || event.schema.name, event.setting.required))
    }

    function renderItems(rootContainer, currentContainer, currentSchema, currentData, status) {
        if (!currentSchema) return;
        var rootSchema = rootContainer.data(schemaKey);

        for (var i = 0; i < currentSchema.length; i++) {
            var schema = currentSchema[i];
            var itemContainer = div('sui-item');
            if (schema.setting && schema.setting.inTab) {
                var tabArea = currentContainer.children('.sui-tabarea').firstOrDefault() || div('sui-tabarea').appendTo(currentContainer);
                var tabs = tabArea.children('.sui-tabs').firstOrDefault() || $('<ul class="sui-tabs">').appendTo(tabArea);
                var tabContainer = $.grep(tabArea.children('.sui-tabcontent'), function (tab, index) { return $(tab).data(nameKey) === schema.setting.inTab; });
                if (!tabContainer.length) {
                    var tabSchema = $.grep(rootSchema.tabs, function (s, index) { return s.name === schema.setting.inTab; });
                    if (!tabSchema.length) throw 'Cannot find tab schema';
                    tabSchema = tabSchema[0];
                    tabContainer = div('sui-tabcontent').data(nameKey, tabSchema.name).appendTo(tabArea);
                    tabs.append($('<li class="sui-tab">').text(tabSchema.caption || tabSchema.name).data('tabContent', tabContainer).data('sort', tabSchema.sortOrder).on('click', showTab));
                    if (tabs.children().length === 1) tabs.children().first().trigger('click');
                }
                itemContainer.appendTo(tabContainer);
            }
            else {
                var topContainer = currentContainer.children('.sui-top').firstOrDefault() || div('sui-top').prependTo(currentContainer);
                itemContainer.appendTo(topContainer);
            }
            renderItem(rootContainer, itemContainer, schema, currentData ? currentData[schema.name] : null, status);
        }
    }

    function render(element, schema, data, status) {
        init();
        var container = $(element);
        if (!container || !container.length) throw 'Invalid container';
        if (container.data(schemaKey)) {
            container.html('').removeData([schemaKey, dataKey, statuskey]);
        }
        container.data(schemaKey, schema).data(dataKey, data).data(statusKey, status);

        if (schema.array) {
            var count = data ? data.length : 0;
            if (status === 'c') count++; 
            var arrayContainer = div('sui-array').appendTo(container);
            for (var i = 0; i < count; i++) {
                renderItems(container, div('sui-group').appendTo(arrayContainer), schema.items, data ? data[i] : null, status);
            }
        }
        else {
            renderItems(container, div('sui-group').appendTo(container), schema.items, data, status);
        }

    }

    this.render = render;
}

var $sui = new SchemaUI();

var schema1 = {
    array: false,
    items: [
        { 
            name: 'Name',
            caption: 'Your Name',
            type: 'string',
            customUI: 'uiFunc',
            setting: {
                required: true,
                pattern: null,
                maxLength: null,
                minLength: 2,
                className: ''
            }
        },
        {
            name: 'Choice',
            caption: 'Your Decision',
            type: 'select',
            customUI: null,
            options: [
                { text: 'Default', value: '' },
                { text: 'Yes', value: '1' },
                { text: 'No', value: '0' }
            ],
            setting: {
                required: true,
                className: '',
                inTab: 'A'
            }
        },
        {
            name: 'Work',
            caption: 'Current Work',
            type: 'group',
            items: [

            ]
        }
    ],
    tabs: [
        { name: 'A', caption: 'Hello', sortOrder: 1 }
    ]
};