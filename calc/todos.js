$(function() {

    var Todo = Backbone.Model.extend({
        defaults: function() {
            return {
                name: "default good",
                price: 0,
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
            this.on("add", function(){
                console.log("Model has been created ");
            })
            this.on("destroy", function(){
                console.log("Model has been deleted ");
            })
            this.on("change:active", function(){
                console.log("Change active  checkbox");
            })
        },
        isNew(){
           return this.get("order") ? false : true;
        },
        sync: function(method, model, options){
            console.log(model.get("order"));
            switch(method){
                case "read": options.url   = "https://5d668943520e1b00141ee3bd.mockapi.io/api/todo/";  break; 
                case "update": options.url = "https://5d668943520e1b00141ee3bd.mockapi.io/api/todo/" + model.get("order"); break; 
                case "delete": options.url = "https://5d668943520e1b00141ee3bd.mockapi.io/api/todo/" + model.get("order");  break; 
                case "create": options.url = "https://5d668943520e1b00141ee3bd.mockapi.io/api/todo/"; break; 
            }
            return Backbone.sync(method, model, options);
        },
        urlRoot: function(){
          return "https://5d668943520e1b00141ee3bd.mockapi.io/api/todo/"  
        },
         url: "https://5d668943520e1b00141ee3bd.mockapi.io/api/todo/",

        toggle: function() {
            this.save({ active: !this.get("active") });
        },
        validate: function(attrs) {
            if (!attrs.name.trim()) return "invalid value";
        }
    });

    var TodoList = Backbone.PageableCollection.extend({
        url: "https://5d668943520e1b00141ee3bd.mockapi.io/api/todo",
        model: Todo,
        mode: "server",
        state: {
          pageSize: 4,
          sortKey: "name",
          order: 1
        },
        queryParams: {
          currentPage: "page",
          pageSize: "limit"
        },
        sync: function(method, model, options){
            console.log(model.get("order"));
            switch(method){
                case "read": options.url = "https://5d668943520e1b00141ee3bd.mockapi.io/api/todo/";  break; 
                case "update": options.url = "https://5d668943520e1b00141ee3bd.mockapi.io/api/todo/" + model.get("order"); break; 
                case "delete": options.url = "https://5d668943520e1b00141ee3bd.mockapi.io/api/todo/" + model.get("order");  break; 
                case "create": options.url = "https://5d668943520e1b00141ee3bd.mockapi.io/api/todo/"; break; 
            }
            return Backbone.sync(method, model, options);
        },
        active: function() {
            return this.where({ active: false });
        },
        remaining: function() {
            return this.where({ active: true });
        },
        nextOrder: function() {
            if (!this.length) return 1;
            return this.last().get('order') + 1;
        },
        comparator: 'order'

      });

        
        var Todos = new TodoList();  
      console.log( Todos )  

    var TodoView = Backbone.View.extend({
        tagName: "li",
        template: _.template($('#item-template').html()),
        events: {
            "click .toggle"   : "toggleActive",
            "dblclick .view"  : "edit",
            "click a.destroy" : "clear",
            "keypress .edit"  : "updateOnEnter",
            "blur .edit"      : "close"
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
            "click #clc-btn": "calculateTotal",
            "click #clear-completed": "clearCompleted",
            "click #add-btn": "showModal",
            "click #sAll": "selectAll",
            "click #usAll": "unselectAll",
            "click #nextPage": "nextPage",
            "click #prevPage": "prevPage",
            "click #firstPage": "firstPage",
            "click #lastPage": "lastPage",
        },
        nextPage: function(){
            Todos.getNextPage();
            this.$("#todo-list").empty();
        },
        prevPage: function(){
            Todos.getPreviousPage();
            this.$("#todo-list").empty();
        },
        firstPage: function(){
            Todos.getFirstPage();
            this.$("#todo-list").empty();
        },
        lastPage: function(){
            Todos.getLastPage();
            this.$("#todo-list").empty();
        },
        calculateTotal: function() {
            var sum = Todos.where({ active: true }).reduce(function(acc, currValue){return +acc + +currValue.get("price") }, 0);
            $('.totalContainer').html("<h2>Total  " + sum + " $</h2>");
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
        createOnEnter: function(e) {
            // delete
        },
        clearCompleted: function() {
            _.invoke(Todos.active(), 'destroy');
            return false;
        },
        selectAll: function () {
            Todos.each(function (todo) {
                if(!todo.get("active"))
                    todo.save({'active': true});
            });
        },
        unselectAll: function (){
            Todos.each(function (todo) {
                if(todo.get("active"))
                    todo.save({'active': false});
            });
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
                Todos.create({ name: this.$("#name").val(), price: this.$("#price").val() });
                this.$("form")[0].reset();
            }
            if (this.params.type == "change") {
                this.model.set("name", this.$("#name").val()  );
                this.model.set("price",this.$("#price").val() );
                this.model.save();
            }

        },
        cancel: function() {
            this.hideModal();
        },
        render: function() {
           $(this.el).html(this.template());
            console.log(this.params.type);
            if (this.params.type == "change") {
                this.$("#name").val(this.model.attributes.name);
                this.$("#price").val(this.model.attributes.price);
            }
            return this;
        }
    })

    var App = new AppView;

});