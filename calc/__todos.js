$(function(){

    var Good = Backbone.Model.extend({
      defaults: function() {
        return {
          name: "empty todo...",
          order: Todos.nextOrder(),
          active: true
        };
      },
      initialize: function() {
        // delete 
        if(this.isValid() == true){
          $("#invalid-error").hide();
        } else {
          $("#invalid-error").show();
        }
        this.on("change", function(){
          console.log("Model has been changed !");
        })
      },
      toggle: function() {
        this.save({active: !this.get("active")});
      },
      validate: function(attrs) {
        if(!attrs.name.trim()) return "invalid value";
      } 
    });
  
  
    var GoodList = Backbone.Collection.extend({
      model: Good,
      localStorage: new Backbone.LocalStorage("todos-backbone"),
      done: function() {
        return this.where({active: true});
      },
      remaining: function() {
        return this.where({done: false});
      },
      nextOrder: function() {
        if (!this.length) return 1;
        return this.last().get('order') + 1;
      },
      comparator: 'order'

    });
  
    var Goods = new GoodList;
  
    var GoodView = Backbone.View.extend({
      tagName:  "li",
      template: _.template($('#item-template').html()),
      events: {
        "click .toggle"   : "toggleDone",
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
        this.$el.toggleClass('done', this.model.get('done'));
        this.input = this.$('.edit');
        return this;
      },
      toggleDone: function() {
        this.model.toggle();
      },
      edit: function() {
        this.$el.addClass("editing");
        this.input.focus();
      },
      close: function() {
        var value = this.input.val();
        if (!value) {
          this.clear();
        } else {
          this.model.save({title: value});
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
        "keypress #new-todo"     : "createOnEnter",
        "click #clear-completed" : "clearCompleted",
        "click #toggle-all"      : "toggleAllComplete",
        "click #show-do"         : "showDo",
        "click #show-done"       : "showDone",
        "click #show-all"        : "showAll"
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
        var done = Todos.done().length;
        var remaining = Todos.remaining().length;
  
        if (Todos.length) {
          this.main.show();
          this.footer.show();
          this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
        } else {
          this.main.hide();
          this.footer.hide();
        }
  
        this.allCheckbox.checked = !remaining;
      },
      addOne: function(todo) {
       // console.log(todo);
       // console.log( $('li').html() );
  
        var view = new TodoView({model: todo});
        this.$("#todo-list").append(view.render().el);
      },
      addAll: function() {
        Todos.remaining().each(this.addOne, this);
      },
      createOnEnter: function(e) {
        if (e.keyCode != 13) return;
        if (!this.input.val()) return;
  
        Todos.create({title: this.input.val()});
        this.input.val('');
      },
      clearCompleted: function() {
        _.invoke(Todos.done(), 'destroy');
        return false;
      },
      toggleAllComplete: function () {
        var done = this.allCheckbox.checked;
        Todos.each(function (todo) { todo.save({'done': done}); });
      },
      showDo: function() {
        $('li.done').addClass('hidden');
        $('li').not('.done').removeClass('hidden');
      },
      showDone: function() {
        $('li').not('.done').addClass('hidden');
        $('li.done').removeClass('hidden');
      },
      showAll: function() {
        $('li').removeClass('hidden');
      }
    });
  
    var App = new AppView;
  
  });
  