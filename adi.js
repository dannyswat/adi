var AdvancedDataInput = function (userSetting) {
    
    var setting = {
        animationSpeed: 500,
        layoutCreated: function (container) {}
    };
    
    $.extend(setting, userSetting);
    
    var lib = this;
    
    var uiTypes = ['string', 'text', 'select', 'radio', 'checkbox', 'checklist', 'date', 'number'];
    
    var logicTypes = ['group', 'array', 'optional'];
    
    var
        ROOTCONTAINER= 'rootContainer',
        DATAOBJECT= 'dataObject',
        ERRORLABEL= 'errorLabel',
        ITEMCONTAINER= 'itemContainer',
        ASSOCONTAINER= 'associatedContainer',
        GROUPCONTAINER= 'groupContainer',
        PARENTNAME= 'parentName',
        DEFINITION= 'definition',
        ARRAYCONTAINER= 'arrayContainer'
    ;

    var error = function (msg, root) {
        if (root)
            root.html('Error occurred');
        else
            alert('Error occurred');
        throw msg;
    };
    
    var uiCreator = {
        'string': function () {
            var ctrl = $('<input type="text" class="ui-string" />').val(this.data || this.options.defaultValue).on('blur', this.validate);
            if (this.options.maxLength) ctrl.attr('maxLength', this.options.maxLength);
            return ctrl;
        },
        'text': function () {
            return $('<textarea class="ui-text"></textarea>').html(this.data || this.options.defaultValue).on('blur', this.validate);
        },
        'select': function () {
            var ctrl = $('<select class="ui-select">');
            for(var i = 0; i < this.options.options.length; i++) {
                ctrl.append($('<option>').attr('value', this.options.options[i].value).html(this.options.options[i].text || this.options.options[i].value));
            }
            if (this.data) ctrl.val(this.data);
            ctrl.on('change', this.validate);

            return ctrl;
        },
        'date': function () {
            var ctrl = $('<input type="text" class="ui-date" />').val(this.data || this.options.defaultValue);
            this.container.append(ctrl);

            var opts = { onSelect: this.validate };
            $.extend(opts, this.options);

            ctrl.datepicker(opts);
            this.appendAlready = true;

            return ctrl;
        },
        'number': function () {
            var ctrl = $('<input type="text" class="ui-number" />').val(this.data || this.options.defaultValue);
            this.container.append(ctrl);

            var opts = { change: this.validate };
            $.extend(opts, this.options);

            ctrl.spinner(opts);
            this.appendAlready = true;

            return ctrl;
        },
        'checkbox': function () {
            return $('<input type="checkbox" class="ui-checkbox" />').prop('checked', this.data === true ? true : (this.data === false ? false : this.options.defaultValue));
        }
    };
    
    var commonRules = ['required', 'pattern'];
    
    var ruleStore = {
        'required': function () {
            if (this.options.required && (this.value === null || this.value === ''))
                setInvalid.call(this, this.options.requiredMessage || (this.caption + ' is required.'));
        },
        'pattern': function () {
            if (this.options.pattern && this.value && !new RegExp(this.options.pattern).test(this.value))
                setInvalid.call(this, this.options.formatMessage || (this.caption + ' is not in correct format.'));
        }
    };
    
    var viewCreator = {
        '_': function () {
            return jSpan('ui-label').html(this.data);
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
        },
        'number': function () {
            return this.container.find('input').spinner('value');
        },
        'checkbox': function () {
            return this.container.find('input').prop('checked');
        }
    };
    
    var render = function (container, definitions, data, crud) {
        
        container.addClass('adi-container').data('crud', crud).data(DATAOBJECT, data);
        
        renderChildren(container, container, definitions, data);

        setting.layoutCreated(container);
    };
    
    var renderChildren = function (root, container, definitions, data) {
        
        var crud = root.data('crud');
        
        for (var i = 0; i < definitions.length; i++) {
            var defn = definitions[i];
            
            var itemContainer = $('<div class="adi-item">').data(PARENTNAME, container.data(PARENTNAME));
            container.append(itemContainer);
            
            renderControl(root, itemContainer, defn, data ? data[defn.name] : null);
            
        }
    };
    
    function setInvalid(msg) {
        this.status.valid = false;
        this.status.message = msg;
    }

    function jSpan(cssClass) {
        return $('<span>').addClass(cssClass);
    }

    function refreshChildren(container) {
        var data = getValue(container);
        var parentName = container.data(PARENTNAME);
        container.html('').data(PARENTNAME, parentName.substring(0, parentName.indexOf('.')));;

        renderControl(container.data(ROOTCONTAINER), container, container.data(DEFINITION), data);

        setting.layoutCreated(container);
    }
    
    function addGroupButtons(groupContainer) {
        
        // Button to remove item from array
        var minButton = $('<i class="fa fa-close removeButton" />').on('click', function () {        
            $(this).data(GROUPCONTAINER).slideUp(setting.animationSpeed, function () { var arrContainer = $(this).parent(); $(this).remove(); refreshChildren(arrContainer); });
        }).data(GROUPCONTAINER, groupContainer);
        
        // Button to reorder items (up) in array
        var moveUpButton = $('<i class="fa fa-arrow-up moveUpButton" />').on('click', function () {        
            var gc = $(this).data(GROUPCONTAINER);
            gc.addClass('movingup'); gc.prev('.adi-group').addClass('movingdown');
            setTimeout(function (gc) { gc.removeClass('movingup'); gc.prev('.adi-group').removeClass('movingdown').before(gc); refreshChildren(gc.parent()); }, setting.animationSpeed, gc);
        }).data(GROUPCONTAINER, groupContainer);
        
        // Button to reorder items (down) in array
        var moveDownButton = $('<i class="fa fa-arrow-down moveDownButton" />').on('click', function () {        
            var gc = $(this).data(GROUPCONTAINER);
            gc.addClass('movingdown'); gc.next('.adi-group').addClass('movingup');
            setTimeout(function (gc) { gc.removeClass('movingdown'); gc.next('.adi-group').removeClass('movingup').after(gc); refreshChildren(gc.parent()); }, setting.animationSpeed, gc);
        }).data(GROUPCONTAINER, groupContainer);
        
        groupContainer.append(minButton).append(moveUpButton).append(moveDownButton);
    }
    
    function addArrayButtons(itemContainer) {
        var addButton = $('<i class="fa fa-plus addButton" />').on('click', function () {
            var container = $(this).data(ARRAYCONTAINER);
            var parentName = container.data(PARENTNAME);
            var grpContainer = $('<div class="adi-group">').data(PARENTNAME, parentName + '['+ container.children('.adi-group').length +']');
            container.append(grpContainer);
            grpContainer.after($(this));
            renderChildren(container.data(ROOTCONTAINER), grpContainer, container.data(DEFINITION).items, null);
            addGroupButtons(grpContainer);
            setting.layoutCreated(grpContainer);

            grpContainer.hide().slideDown(setting.animationSpeed);
            
        }).data(ARRAYCONTAINER, itemContainer);
        
        itemContainer.append(addButton);
    }
    
    function renderOptionalControl(itemContainer, selectBox, value) {
        
        var defn = itemContainer.data(DEFINITION);
        
        var parentName = itemContainer.data(PARENTNAME);

        var optDefinition;
    
        for (var oi in defn.options.options) {
            var opt = defn.options.options[oi];
            if (opt.value === (value || selectBox.val())) {
                optDefinition = opt.definition;
            }
        }

        setting.layoutCreated(itemContainer);
        
        if (optDefinition) {
            var item2Container = $('<div class="adi-item option-group">').data(PARENTNAME, parentName);
            selectBox.data(ASSOCONTAINER, item2Container);
            itemContainer.after(item2Container);
            var parentData = itemContainer.parent().data(DATAOBJECT);
            renderControl(itemContainer.data(ROOTCONTAINER), item2Container, optDefinition, parentData ? parentData[optDefinition.name] : null);

            setting.layoutCreated(item2Container);
        }
    }
    
    var renderControl = function (root, itemContainer, defn, data) {
        
        var crud = root.data('crud');
        
        var parentName = itemContainer.data(PARENTNAME);

        if (uiTypes.indexOf(defn.type) < 0 && logicTypes.indexOf(defn.type) < 0) error('Invalid ui type: ' + defn.type, root);
        
        itemContainer.data(DEFINITION, defn).data(DATAOBJECT, data).data(ROOTCONTAINER, root);
        
        switch (defn.type) {
            case 'group':
                var groupContainer = $('<div class="adi-group">').data(DATAOBJECT, data).data(PARENTNAME, (parentName ? parentName + '.' : '') + defn.name);
                itemContainer.append($('<div class="adi-header">').html(defn.caption || defn.name)).append(groupContainer);
                renderChildren(root, groupContainer, defn.items, data);
                return;
            case 'array':
                itemContainer.addClass('adi-array').data(PARENTNAME, (parentName ? parentName + '.' : '') + defn.name);
                var rowCount = data ? data.length : (crud === "c" ? 1 : 0);
                if (crud !== "r" || rowCount > 0) itemContainer.append($('<div class="adi-header">').html(defn.caption || defn.name));
                for (var i = 0; i < rowCount; i++) {
                    var arrGroupContainer = $('<div class="adi-group">').data(DATAOBJECT, data ? data[i] : null).data(PARENTNAME, itemContainer.data(PARENTNAME) + '[' + i + ']');
                    itemContainer.append(arrGroupContainer);
                    renderChildren(root, arrGroupContainer, defn.items, data ? data[i] : null);
                    
                    addGroupButtons(arrGroupContainer);
                }
                
                addArrayButtons(itemContainer);
                return;
            case 'optional':
                renderControl(root, itemContainer, { name: defn.name, caption: defn.caption, options: defn.options, type: 'select' }, data);
                
                var selectBox = itemContainer.find('select');
                
                selectBox.data(ITEMCONTAINER, itemContainer).on('change', function () {
                    
                    var assContainer = $(this).data(ASSOCONTAINER);
                    if (assContainer) assContainer.remove();
                    var itemContainer = $(this).data(ITEMCONTAINER);
                    
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
            validate: function () { getValue($(this).data(ITEMCONTAINER)); },
            skipCaption: false,
            appendAlready: false
        };
        
        if (crud === "c" || crud === "u") {
            
            var ctrl = uiCreator[defn.type].call(uiSetting);
            
            ctrl.attr('name', (parentName ? parentName + '.' : '') + defn.name).data(ITEMCONTAINER, itemContainer);

            if (!uiSetting.skipCaption) itemContainer.prepend(jSpan('adi-caption').html(defn.caption || defn.name));
            if (!uiSetting.appendAlready) itemContainer.append(jSpan('adi-ctrl').append(ctrl)); 
            
            var errorLabel = jSpan('adi-error').hide();
            itemContainer.data(ERRORLABEL, errorLabel).append(errorLabel);
        }
        else if (crud === "r") {
            
            var field = viewCreator[defn.type] ? viewCreator[defn.type].call(uiSetting) : viewCreator['_'].call(uiSetting);
            
            if (!uiSetting.skipCaption) itemContainer.prepend(jSpan('adi-caption').html(defn.caption || defn.name));
            if (!uiSetting.appendAlready) itemContainer.append(jSpan('adi-view').append(field)); 
        }
    }
    
    var getObject = function (container, errorSummary) {
        var value = {};
        container.children('.adi-item').each(function () {
            value[$(this).data(DEFINITION).name] = getValue($(this), errorSummary);
        });
        container.data(DATAOBJECT, value);

        return value;
    }
    
    var getValue = function (itemContainer, errorSummary) {
        
        var defn = itemContainer.data(DEFINITION);
        var type = defn.type;
        var result;
        
        switch (type) {
            case 'group':
                result = getObject(itemContainer.children('.adi-group').first(), errorSummary);
                
                break;
            case 'array':
                var value = [];
                itemContainer.children('.adi-group').each(function () { value.push(getObject($(this), errorSummary)); });
                result = (defn.convertEmptyToNull && value.length === 0) ? null : value;

                break;
            case 'optional':
                type = 'select';
                
                break;
        }
        
        if (result) { itemContainer.data(DATAOBJECT, result); return result; }

        if (uiTypes.indexOf(type) >= 0) {
        
            var uiSetting = {
                definition: defn,
                container: itemContainer
            };

            result = uiExplorer[type].call(uiSetting);
            itemContainer.data(DATAOBJECT, result); 
            
            var validateSetting = {
                options: defn.options || {},
                caption: defn.caption || defn.name,
                value: result,
                status: { valid: true, message: '' }
            }
            
            for (var i in commonRules) {
                ruleStore[commonRules[i]].call(validateSetting);
                var errLabel = itemContainer.data(ERRORLABEL);
                if (!validateSetting.status.valid) { 
                    
                    errLabel.html(validateSetting.status.message).fadeIn();
                    if (errorSummary) { errorSummary.valid = false; errorSummary.messages.push(validateSetting.status.message); } 
                    break; 
                }
                else {
                    errLabel.html('').hide();
                }
            }
            
            
            return result;
        }
        else
            error('Invalid ui type: ' + type);
    };
    this.AddUIType = function (type, uiFunc, getFunc, viewFunc, override) {
        
        if (typeof type !== 'string' || typeof uiFunc !== 'function' || typeof getFunc !== 'function') error('Invalid UI Type Initialization');

         if (uiTypes.indexOf(type) < 0 || override) {
            if (uiTypes.indexOf(type) < 0) uiTypes.push(type);
            uiCreator[type] = uiFunc;
            uiExplorer[type] = getFunc;
            if (typeof viewFunc === 'function') viewCreator[type] = viewFunc;
         }
    };
    this.Render = render;
    this.GetData = function (container, callback) {
        var errorSummary = { valid: true, messages: [] };
        var obj = getObject(container, errorSummary);
        if (typeof callback === "function") callback(obj, errorSummary);
        return obj;
    };
};