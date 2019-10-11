$(function() {

    var Todo = Backbone.Model.extend({
        defaults: function() {
            return {
                name: "default good",
                order: Todos.nextOrder(),
                active: true
            };
        },
        initialize: function() {
            if (this.isValid() == true) {
                $("#invalid-error").hide();
            } else {
                $("#invalid-error").show();
            }
            this.on("change", function() {
                console.log("Model has been changed !");
            })
        },
        toggle: function() {
            this.save({ active: !this.get("active") });
        },
        validate: function(attrs) {
            if (!attrs.name.trim()) return "invalid value";
        }
    });


    var TodoList = Backbone.Collection.extend({
        model: Todo,
        localStorage: new Backbone.LocalStorage("todos-backbone"),
        active: function() {
            return this.where({ active: true });
        },
        remaining: function() {
            return this.where({ active: false });
        },
        nextOrder: function() {
            if (!this.length) return 1;
            return this.last().get('order') + 1;
        },
        comparator: 'order'

    });

    var Todos = new TodoList;
  //  Todos.create({ name: "app" })

    var TodoView = Backbone.View.extend({
        tagName: "li",
        template: _.template($('#item-template').html()),
        events: {
            "click .toggle": "toggleActive",
            "dblclick .view": "edit",
            "click a.destroy": "clear",
            "keypress .edit": "updateOnEnter",
            "blur .edit": "close"
        },
        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.toggleClass('active', this.model.get('active'));
            this.input = this.$('.edit');
            return this;
        },
        toggleActive: function() {
            this.model.toggle();
        },
        edit: function() {
            console.log(this.model.attributes)
                // this.$el.addClass("editing");
                // this.input.focus();
            var view = new TodoModal({ model: this.model, type: "change" });
            view.render().showModal({
                x: 400,
                y: 220
            });


        },
        close: function() {
            var value = this.input.val();
            if (!value) {
                this.clear();
            } else {
                this.model.save({ name: value });
                this.$el.removeClass("editing");
            }
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) this.close();
        },
        clear: function() {
            this.model.destroy();
        }

    });
    var AppView = Backbone.View.extend({
        el: $("#todoapp"),
        statsTemplate: _.template($('#stats-template').html()),
        events: {
            "keypress #new-todo": "createOnEnter",
            "click #clear-completed": "clearCompleted",
            "click #add-btn": "showModal",
            "click #calc-btn": "calculateTotal",
        },
        initialize: function() {

            this.input = this.$("#new-todo");
            this.allCheckbox = this.$("#toggle-all")[0];

            this.listenTo(Todos, 'add', this.addOne);
            this.listenTo(Todos, 'reset', this.addAll);
            this.listenTo(Todos, 'all', this.render);

            this.footer = this.$('footer');
            this.main = $('#main');

            Todos.fetch();
        },
        render: function() {
            var active = Todos.active().length;
            var remaining = Todos.remaining().length;
                this.main.show();
                this.footer.show();
                this.footer.html(this.statsTemplate({ active: active, remaining: remaining }));

            this.allCheckbox.checked = !remaining;
        },
        addOne: function(todo) {
            console.log("add one func");
            var view = new TodoView({ model: todo });
            this.$("#todo-list").append(view.render().el);
        },
        showModal: function(todo) {
            console.log("show modal func");
            var view = new TodoModal({ model: todo, type: "addNew" });
            view.render().showModal({
                x: 400,
                y: 220
            });
        },
        calculateTotal: function() {
            console.log("calculate total");
        },
        createOnEnter: function(e) {
            // delete
        },
        clearCompleted: function() {
            _.invoke(Todos.active(), 'destroy');
            return false;
        }
    });

    var TodoModal = Backbone.ModalView.extend({
        name: "AddPersonView",
        model: Todo,
        params: "",
        templateHtml: $('#modal-template').html(),
        initialize: function(params) {
            this.params = params;
            _.bindAll(this, "render");
            this.template = _.template(this.templateHtml);
        },
        events: {
            "submit form": "save",
            "click #cancelBtn": "cancel"
        },
        save: function(event) {
            event.preventDefault();
            if (!this.$("#name").val() && !this.$("#price").val()) return;
            //log 
            console.log(this.$("#name").val() + "   " + this.$("#price").val());
            if (this.params.type == "addNew") {
                Todos.create({ name: this.$("#name").val() });
                this.$("form")[0].reset();
            }
            if (this.params.type == "change") {
                this.model.set("name", this.$("#name").val());
            }

        },
        cancel: function() {
            this.hideModal();
        },
        render: function() {
           $(this.el).html(this.template());
          // this.$el.html(this.templateHtml(this.model.toJSON()));
            console.log(this.params.type);
            if (this.params.type == "change")
                this.$("#name").val(this.model.attributes.name);
            return this;
        }
    })

    var App = new AppView;

});