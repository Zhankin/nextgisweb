/* globals define, console */
define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dijit/layout/ContentPane",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/data/ItemFileWriteStore",
    "dijit/tree/TreeStoreModel",
    "dijit/Tree",
    "dijit/tree/dndSource",
    "dijit/registry",
    "ngw-pyramid/i18n!wmsserver",
    "ngw-pyramid/hbs-i18n",
    "ngw-resource/serialize",
    "ngw-resource/ResourceStore",
    "ngw-resource/ResourcePicker",
    // resource
    "dojo/text!./template/ServiceWidget.hbs",
    // template
    "dijit/layout/TabContainer",
    "dojox/layout/TableContainer",
    "dijit/layout/BorderContainer",
    "dijit/layout/StackContainer",
    "dijit/layout/ContentPane",
    "dijit/Dialog",
    "dijit/Toolbar",
    "dijit/form/Form",
    "ngw-pyramid/form/KeynameTextBox",
    "ngw-pyramid/form/DisplayNameTextBox",
    "ngw-pyramid/form/ScaleTextBox",
    "dijit/form/TextBox",
    "dijit/form/CheckBox",
    "dijit/form/NumberTextBox",
    "dijit/form/Select",
    "ngw-resource/Tree"
], function (
    declare,
    array,
    lang,
    domStyle,
    ContentPane,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    ItemFileWriteStore,
    TreeStoreModel,
    Tree,
    dndSource,
    registry,
    i18n,
    hbsI18n,
    serialize,
    ResourceStore,
    ResourcePicker,
    template
) {
    return declare([ContentPane, serialize.Mixin, _TemplatedMixin, _WidgetsInTemplateMixin], {
        title: i18n.gettext("WMS service"),
        templateString: hbsI18n(template, i18n),

        constructor: function () {
            this.itemStore = new ItemFileWriteStore({data: {
                items: [{item_type: "root"}]
            }});

            this.itemModel = new TreeStoreModel({
                store: this.itemStore,
                query: {}
            });

            var widget = this;

            this.widgetTree = new Tree({
                model: this.itemModel,
                showRoot: false,
                getLabel: function (item) { return item.display_name; },
                getIconClass: function(item, opened){
                    return "dijitLeaf";
                },
                persist: false,
                dndController: dndSource,
                checkItemAcceptance: function (node, source, position) {
                    return position !== "over";
                },
                betweenThreshold: 5
            });

            this.itemIdx = 0;
            this.widgetTreeRootNodeId = this.widgetTree.rootNode.getIdentity();
        },

        postCreate: function () {
            this.inherited(arguments);

            // Создать дерево без model не получается, поэтому создаем его вручную
            this.widgetTree.placeAt(this.containerTree).startup();

            var widget = this;

            // Добавление нового слоя
            this.btnAddLayer.on("click", lang.hitch(this, function () {
                this.layerPicker.pick().then(lang.hitch(this, function (itm) {
                    this.itemStore.newItem({
                            "keyname": null,
                            "display_name": itm.display_name,
                            "resource_id": itm.id,
                            "min_scale_denom": null,
                            "max_scale_denom": null
                        }, {
                            parent: widget.itemModel.root,
                            attribute: "children"
                        }
                    );
                    this.itemIdx++;
                    this.widgetTree.set("path", [
                        this.widgetTreeRootNodeId,
                        this.itemIdx
                    ]);
                }));
            }));

            // Удаление слоя или группы
            this.btnDeleteItem.on("click", function() {
                var item = widget.widgetTree.selectedItem,
                    identity = widget.itemModel.getIdentity(item),
                    node = widget.widgetTree._itemNodesMap[identity][0],
                    prevSibling = node.getPreviousSibling(),
                    nextSibling = node.getNextSibling();

                // Переключаемся на соседнюю ноду
                var sibling = prevSibling ? prevSibling : nextSibling;
                if (sibling) {
                    widget.widgetTree.set("path", [
                        widget.widgetTreeRootNodeId,
                        sibling.getIdentity()
                    ]);
                } else {
                    widget.treeLayoutContainer.removeChild(widget.itemPane);
                    widget.btnDeleteItem.set("disabled", true);
                }

                widget.itemStore.deleteItem(item);
            });

            this.widgetTree.watch("selectedItem", function (attr, oldValue, newValue) {
                if (newValue) {
                    widget.widgetProperties.selectChild(widget.paneLayer);
                    widget.widgetItemKeyname.set("value", widget.getItemValue("keyname"));
                    widget.widgetItemDisplayName.set("value", widget.getItemValue("display_name"));
                    widget.wLayerMinScale.set("value", widget.getItemValue("min_scale_denom"));
                    widget.wLayerMaxScale.set("value", widget.getItemValue("max_scale_denom"));

                    // Изначально боковая панель со свойствами текущего элемента
                    // спрятана. Поскольку элемент уже выбран - ее нужно показать.
                    if (!oldValue) {
                        domStyle.set(widget.itemPane.domNode, "display", "block");
                        widget.treeLayoutContainer.addChild(widget.itemPane);
                    }

                    // Активируем кнопку удаления слоя или группы
                    widget.btnDeleteItem.set("disabled", false);

                    // Помещаем фокус на обязательное поле с ключом
                    widget.widgetItemKeyname.focus();
                }
            });

            this.widgetItemKeyname.watch("value", function (attr, oldValue, newValue) {
                widget.setItemValue("keyname", newValue);
            });

            this.widgetItemDisplayName.watch("value", function (attr, oldValue, newValue) {
                widget.setItemValue("display_name", newValue);
            });

            this.wLayerMinScale.watch("value", function (attr, oldVal, newVal) {
                widget.setItemValue("min_scale_denom", newVal);
            });

            this.wLayerMaxScale.watch("value", function (attr, oldVal, newVal) {
                widget.setItemValue("max_scale_denom", newVal);
            });
        },

        startup: function () {
            this.inherited(arguments);
        },

        // установить значение аттрибута текущего элемента
        setItemValue: function (attr, value) {
            this.itemStore.setValue(this.widgetTree.selectedItem, attr, value);
        },

        // значение аттрибута текущего элемента
        getItemValue: function (attr) {
            if (this.widgetTree.selectedItem) {
                return this.itemStore.getValue(this.widgetTree.selectedItem, attr);
            }
        },

        serializeInMixin: function (data) {
            if (data.wmsserver_service === undefined) { data.wmsserver_service = {}; }
            var store = this.itemStore;

            function dump(itm) {
                return {
                    keyname: store.getValue(itm, "keyname"),
                    display_name: store.getValue(itm, "display_name"),
                    resource_id: store.getValue(itm, "resource_id"),
                    min_scale_denom: store.getValue(itm, "min_scale_denom"),
                    max_scale_denom: store.getValue(itm, "max_scale_denom")
                };
            }

            data.wmsserver_service.layers = array.map(store.getValues(this.itemModel.root, "children"), function (i) {
                return dump(i); });
        },

        deserializeInMixin: function (data) {
            var value = data.wmsserver_service.layers;
            if (value === undefined) { return; }

            array.forEach(value, function (i) {
                this.itemStore.newItem(i, {parent: this.itemModel.root, attribute: "children"});
                this.itemIdx++;
            }, this);

            // При загрузке отмечаем самую первую ноду
            if (this.itemIdx > 0) {
                this.widgetTree.set("path", [this.widgetTreeRootNodeId, 1]);
            }
        },

        validateDataInMixin: function (errback) {
            var success = true;

            array.every(this.widgetTree.rootNode.getChildren(), function (n) {
                this.widgetTree.set("path", [
                    this.widgetTreeRootNodeId,
                    n.getIdentity()
                ]);
                success = success && this.widgetPropertiesForm.validate();
                return success;
            }, this);

            return success;
        }
    });
});
