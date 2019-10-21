$(function() {
    // change it if you change mock api endpoint
    var mockBaseUrl = "https://5d668943520e1b00141ee3bd.mockapi.io/api/goods2/";

    var Goods = Backbone.Model.extend({
        defaults: function() {
            return {
                title: "default good",
                price: 0,
                description: "default description",
            };
        },
        initialize: function() {

        },
        isNew(){
           return this.get("id") ? false : true;
        },
        sync: function(method, model, options){
            switch(method){
                case "read"  : options.url   = mockBaseUrl;                     break; 
                case "update": options.url = mockBaseUrl + model.get("id");  break; 
                case "delete": options.url = mockBaseUrl + model.get("id");  break; 
                case "create": options.url = mockBaseUrl;                       break; 
            }
            return Backbone.sync(method, model, options);
        },
        urlRoot: function(){
          return mockBaseUrl 
        },
         url: mockBaseUrl
    });

    var CartList = Backbone.Collection.extend({
        model: Goods,
        localStorage: new Backbone.LocalStorage("cart-list"),
        comparator: 'id',
        nextOrder: function() {
            if (!this.length) return 1;
            return this.last().get('id') + 1;
          }
    });

     var carts = new CartList();
     carts.add({ id: 7, title: "some title", price: 12});
     console.log( carts );


    var CartItemView = Backbone.View.extend({
        tagName: "li",
        template: _.template($('#cart-item-template').html()),
        events: {
         "click a.destroy" : "clear"
        },
        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
            this.render()
          },
          render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
          },
          clear: function() {
            this.model.destroy();
          }
    })
 
  var cartview = new CartView(carts);  
   var CartView = Backbone.View.extend({
    el: $("cart-template"), 
    template: _.template($("#cart-template").html()),
    render: function(){
       // console.log($("#cart-template").html())
        $(".cart").append(this.template);
    },
    initialize: function(){
        this.listenTo(carts, 'add', this.addOne);
        this.listenTo(carts, 'all', this.render);
        carts.fetch();
    },
    addOne: function(cart) {
        var view = new CartItemView({model: cart});
        console.log($("#cart-template").html());
        this.$("#cart-list").append(view.render().el);
      }
})


 


   


    var GoodsList = Backbone.PageableCollection.extend({
        url: mockBaseUrl,
        model: Goods,
        mode: "server",
        comparator: 'id',
        state: {
          pageSize: 4,
          sortKey: "title",
          order: 1,
        },
        queryParams: {
          currentPage: "page",
          pageSize: "limit",
        },
        sync: function(method, model, options){
            switch(method){
                case   "read": options.url = mockBaseUrl;                       break; 
                case "update": options.url = mockBaseUrl + model.get("id");  break; 
                case "delete": options.url = mockBaseUrl + model.get("id");  break; 
                case "create": options.url = mockBaseUrl;                       break; 
            }
            return Backbone.sync(method, model, options);
        },
        initialize: function(){
            var self = this;
            this.on("request", function(){
                $.get(mockBaseUrl, function(data){
                    self.state.lastPage =  Math.ceil( data.length / self.state.pageSize);  
                });
            })
        }
      });

        
      var goods = new GoodsList();  

    var GoodsView = Backbone.View.extend({
        tagName: "li",
        template: _.template($('#item-template').html()),
        events: {
        },
        initialize: function() {
        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    var AppView = Backbone.View.extend({
        el: $("#goodsapp"),
        statsTemplate: _.template($('#stats-template').html()),
        
        events: {
            "click #nextPage": "nextPage",
            "click #prevPage": "prevPage",
            "click #firstPage": "firstPage",
            "click #lastPage": "lastPage",
            "click #pageNum" : "getPage",
        },
        nextPage: function(){
            if(goods.hasNextPage()){
                goods.getNextPage();
                this.$("#goods-list").empty();
            }
        },
        prevPage: function(){
            if(goods.hasPreviousPage()){
                goods.getPreviousPage();
                this.$("#goods-list").empty();
            }
        },
        firstPage: function(){
            goods.getFirstPage();
            this.$("#goods-list").empty();
        },
        lastPage: function(){
            goods.getLastPage();
            this.$("#goods-list").empty();
        },
        getPage: function(e){
          goods.getPage(parseInt(e.srcElement.innerHTML));
          this.$("#goods-list").empty();
        },
        initialize: function() {
            this.listenTo(goods, 'add', this.addOne);
            this.listenTo(goods, 'all', this.render);
            this.footer = this.$('footer');
           goods.fetch();
        },
        addOne: function(goodsModel) {
            console.log("add one func");
            var view = new GoodsView({ model: goodsModel });
            if(goods.state.pageSize < goods.length) return this;  // fixed items on page  
            this.$("#goods-list").append(view.render().el);
        },
        render: function() {
            this.footer.show();
            this.footer.html(this.statsTemplate());
        }
    });

    var myRouter = Backbone.Router.extend({
        routes: {
            "":                   "default",
          "login":                 "login",    
          "logout":                 "logout", 
          "registration":            "registration", 
          "goods":                 "goods", 
          "cart":                 "cart", 
          "goods/:id":          "goods",
          "*random" :             "notFound",
        },
        default: function(){
            console.log("default router");
        },
        login: function() {
            new LoginView();
        },
        logout: function() {
            console.log("logout router");
        },
        registration: function() {
            new RegistrationView();
        },
        goods: function(id) {
            var App = new AppView();
            console.log("goods router" + id);
        },
        cart: function() {
            console.log("cart router");
            new CartView();
        },
        notFound: function(){
            console.log("url not found 404 error");
        },
        initialize: function(){
            Backbone.history.start();
        }
      
      });

    var LoginView = Backbone.View.extend({
        render: function(){
            $(".login").append( $("#login-template").html());
        },
        initialize: function(){
            this.render();
        }
    })

    var RegistrationView = Backbone.View.extend({
        render: function(){
            $(".login").append( $("#registration-template").html());
        },
        initialize: function(){
            this.render();
        }
    })

   


    

    var router = new myRouter();
      

});