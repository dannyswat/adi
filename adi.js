var AdvancedDataInput = function (userSetting) {
    
    var setting = {
        animationSpeed: 500
    };
    
    $.extend(setting, userSetting);
    
    var lib = this;
    
    var uiTypes = ['string', 'text', 'select', 'radio', 'checkbox', 'checklist', 'date'];
    
    var logicTypes = ['group', 'array', 'optional'];
    
    var error = (msg, root) => {
        if (root)
            root.html('Error occurred');
        else
            alert('Error occurred');
        throw msg;
    };
    
    var uiCreator = {
        'string': function () {
            return $('<input type="text" class="ui-string" />').val(this.data || this.options.defaultValue);
        },
        'text': function () {
            return $('<textarea class="ui-text"></textarea>').html(this.data || this.options.defaultValue);
        },
        'select': function () {
            var ctrl = $('<select class="ui-select">');
            for(var i = 0; i < this.options.options.length; i++) {
                ctrl.append($('<option>').attr('value', this.options.options[i].value).html(this.options.options[i].text || this.options.options[i].value));
            }
            if (this.data) ctrl.val(this.data);
            
            return ctrl;
        },
        'date': function () {
            var ctrl = $('<input type="text" class="ui-date" />').val(this.data || this.options.defaultValue);
            this.container.append(ctrl);
            ctrl.datepicker(this.options);
            this.appendAlready = true;
            return ctrl;
        }
    };
    
    var commonRules = ['required', 'pattern'];
    
    var ruleStore = {
        'required': function () {
            if (this.options.required && (this.value === null || this.value === ''))
                setInvalid.call(this, this.options.requiredMessage || (this.caption + ' is required.'));
        },
        'pattern': function () {
            if (this.options.pattern && this.value && !this.value.test(this.options.pattern))
                setInvalid.call(this, this.options.requiredMessage || (this.caption + ' is not in correct format.'));
        }
    };
    
    var viewCreator = {
        '_': function () {
            return $('<span class="ui-label">').html(this.data);
        }
    };
    
    var uiExplorer = {
        'string': function () {
            return this.container.find('input').val();
        },
        'text': function () {
            return this.container.find('textarea').html();
        },
        'select': function () {
            return this.container.find('select').val();
        },
        'date': function () {
            return this.container.find('input').val();
        }
    };
    
    var render = (container, definitions, data, crud) => {
        
        container.addClass('adi-container').data('crud', crud).data('dataObject', data);
        
        renderChildren(container, container, definitions, data);
    };
    
    var renderChildren = (root, container, definitions, data) => {
        
        var crud = root.data('crud');
        
        for (var i = 0; i < definitions.length; i++) {
            var defn = definitions[i];
            
            var itemContainer = $('<div class="adi-item">').data('parentName', container.data('parentName'));
            container.append(itemContainer);
            
            renderControl(root, itemContainer, defn, data ? data[defn.name] : null);
            
        }
    };
    
    function setInvalid(msg) {
        this.status.valid = false;
        this.status.message = msg;
    }

    function refreshChildren(container) {
        var data = getValue(container);
        var parentName = container.data('parentName');
        container.html('').data('parentName', parentName.substring(0, parentName.indexOf('.')));;
        //data[container.data('definition').name] = data;
        renderControl(container.data('rootContainer'), container, container.data('definition'), data);
    }
    
    function addGroupButtons(groupContainer) {
        
        // Button to remove item from array
        var minButton = $('<i class="fa fa-close removeButton" />').on('click', function () {        
            $(this).data('groupContainer').slideUp(setting.animationSpeed, function () { var arrContainer = $(this).parent(); $(this).remove(); refreshChildren(arrContainer); });
        }).data('groupContainer', groupContainer);
        
        // Button to reorder items (up) in array
        var moveUpButton = $('<i class="fa fa-arrow-up moveUpButton" />').on('click', function () {        
            var gc = $(this).data('groupContainer');
            gc.addClass('movingup'); gc.prev('.adi-group').addClass('movingdown');
            setTimeout(function (gc) { gc.removeClass('movingup'); gc.prev('.adi-group').removeClass('movingdown').before(gc); refreshChildren(gc.parent()); }, setting.animationSpeed, gc);
        }).data('groupContainer', groupContainer);
        
        // Button to reorder items (down) in array
        var moveDownButton = $('<i class="fa fa-arrow-down moveDownButton" />').on('click', function () {        
            var gc = $(this).data('groupContainer');
            gc.addClass('movingdown'); gc.next('.adi-group').addClass('movingup');
            setTimeout(function (gc) { gc.removeClass('movingdown'); gc.next('.adi-group').removeClass('movingup').after(gc); refreshChildren(gc.parent()); }, setting.animationSpeed, gc);
        }).data('groupContainer', groupContainer);
        
        groupContainer.append(minButton).append(moveUpButton).append(moveDownButton);
    }
    
    function addArrayButtons(itemContainer) {
        var addButton = $('<i class="fa fa-plus addButton" />').on('click', function () {
            var container = $(this).data('arrayContainer');
            var parentName = container.data('parentName');
            var grpContainer = $('<div class="adi-group">').data('parentName', parentName + '['+ container.children('.adi-group').length +']');
            container.append(grpContainer);
            grpContainer.after($(this));
            renderChildren(container.data('rootContainer'), grpContainer, container.data('definition').items, null);
            addGroupButtons(grpContainer);
            
            grpContainer.hide().slideDown(setting.animationSpeed);
            
        }).data('arrayContainer', itemContainer);
        
        itemContainer.append(addButton);
    }
    
    function renderOptionalControl(itemContainer, selectBox, value) {
        
        var defn = itemContainer.data('definition');
        
        var parentName = itemContainer.data('parentName');

        var optDefinition;
    
        for (var oi in defn.options.options) {
            var opt = defn.options.options[oi];
            if (opt.value === (value || selectBox.val())) {
                optDefinition = opt.definition;
            }
        }
        
        if (optDefinition) {
            var item2Container = $('<div class="adi-item option-group">').data('parentName', parentName);
            selectBox.data('associatedContainer', item2Container);
            itemContainer.after(item2Container);
            var parentData = itemContainer.parent().data('dataObject');
            renderControl(itemContainer.data('rootContainer'), item2Container, optDefinition, parentData ? parentData[optDefinition.name] : null)
        }
    }
    
    var renderControl = (root, itemContainer, defn, data) => {
        
        var crud = root.data('crud');
        
        var parentName = itemContainer.data('parentName');

        if (uiTypes.indexOf(defn.type) < 0 && logicTypes.indexOf(defn.type) < 0) error('Invalid ui type: ' + defn.type, root);
        
        itemContainer.data('definition', defn).data('dataObject', data).data('rootContainer', root);
        
        switch (defn.type) {
            case 'group':
                var groupContainer = $('<div class="adi-group">').data('dataObject', data).data('parentName', (parentName ? parentName + '.' : '') + defn.name);
                itemContainer.append($('<div class="adi-header">').html(defn.caption || defn.name)).append(groupContainer);
                renderChildren(root, groupContainer, defn.items, data);
                return;
            case 'array':
                itemContainer.addClass('adi-array').data('parentName', (parentName ? parentName + '.' : '') + defn.name);
                var rowCount = data ? data.length : (crud === "c" ? 1 : 0);
                if (crud !== "r" || rowCount > 0) itemContainer.append($('<div class="adi-header">').html(defn.caption || defn.name));
                for (var i = 0; i < rowCount; i++) {
                    var arrGroupContainer = $('<div class="adi-group">').data('dataObject', data ? data[i] : null).data('parentName', itemContainer.data('parentName') + '[' + i + ']');
                    itemContainer.append(arrGroupContainer);
                    renderChildren(root, arrGroupContainer, defn.items, data ? data[i] : null);
                    
                    addGroupButtons(arrGroupContainer);
                }
                
                addArrayButtons(itemContainer);
                return;
            case 'optional':
                renderControl(root, itemContainer, { name: defn.name, caption: defn.caption, options: defn.options, type: 'select' }, data);
                
                var selectBox = itemContainer.find('select');
                
                selectBox.data('itemContainer', itemContainer).on('change', function () {
                    
                    var assContainer = $(this).data('associatedContainer');
                    if (assContainer) assContainer.remove();
                    var itemContainer = $(this).data('itemContainer');
                    
                    renderOptionalControl(itemContainer, $(this));
                });
                    
                var optValue = data || getValue(itemContainer);

                renderOptionalControl(itemContainer, selectBox, optValue);
                
                return;
        }
        
        var uiSetting = {
            container: itemContainer,
            definition: defn,
            inputName: (parentName ? parentName + '.' : '') + defn.name,
            options: defn.options || {},
            data: data,
            crud: crud,
            validate: () => { getValue(this.container); },
            skipCaption: false,
            appendAlready: false
        };
        
        if (crud === "c" || crud === "u") {
            
            var ctrl = uiCreator[defn.type].call(uiSetting);
            
            ctrl.attr('name', (parentName ? parentName + '.' : '') + defn.name);

            if (!uiSetting.skipCaption) itemContainer.prepend($('<span class="adi-caption">').html(defn.caption || defn.name));
            if (!uiSetting.appendAlready) itemContainer.append($('<span class="adi-ctrl">').append(ctrl)); 
        }
        else if (crud === "r") {
            
            var field = viewCreator[defn.type] ? viewCreator[defn.type].call(uiSetting) : viewCreator['_'].call(uiSetting);
            
            if (!uiSetting.skipCaption) itemContainer.prepend($('<span class="adi-caption">').html(defn.caption || defn.name));
            if (!uiSetting.appendAlready) itemContainer.append($('<span class="adi-view">').append(field)); 
        }
    }
    
    var getObject = function (container) {
        var value = {};
        container.children('.adi-item').each(function () {
            value[$(this).data('definition').name] = getValue($(this));
        });
        container.data('dataObject', value);

        return value;
    }
    
    var getValue = function (itemContainer) {
        
        var defn = itemContainer.data('definition');
        var type = defn.type;
        var result;
        
        switch (type) {
            case 'group':
                result = getObject(itemContainer.children('.adi-group').first());
                
                break;
            case 'array':
                var value = [];
                itemContainer.children('.adi-group').each(function () { value.push(getObject($(this))); });
                result = (defn.convertEmptyToNull && value.length === 0) ? null : value;

                break;
            case 'optional':
                type = 'select';
                
                break;
        }
        
        if (result) { itemContainer.data('dataObject', result); return result; }

        if (uiTypes.indexOf(type) >= 0) {
        
            var uiSetting = {
                definition: defn,
                container: itemContainer
            };

            result = uiExplorer[type].call(uiSetting);
            itemContainer.data('dataObject', result); 
            
            var validateSetting = {
                options: defn.options || {},
                caption: defn.caption || defn.name,
                value: result,
                status: { valid: true, message: '' }
            }
            
            for (var i in commonRules) {
                ruleStore[commonRules[i]].call(validateSetting);
            }
            
            
            return result;
        }
        else
            error('Invalid ui type: ' + type);
    };
    this.AddUIType = (type, uiFunc, getFunc, viewFunc, override) => {
        
        if (typeof type !== 'string' || typeof uiFunc !== 'function' || typeof getFunc !== 'function') throw 'Invalid UI Type Initialization';

         if (uiTypes.indexOf(type) < 0 || override) {
            if (uiTypes.indexOf(type) < 0) uiTypes.push(type);
            uiCreator[type] = uiFunc;
            uiExplorer[type] = getFunc;
            if (typeof viewFunc === 'function') viewCreator[type] = viewFunc;
         }
    };
    this.Render = render;
    this.GetData = getObject;
};