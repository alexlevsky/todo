$(function() {
    // change it if you change mock api endpoint
    var mockBaseUrl = "https://5d668943520e1b00141ee3bd.mockapi.io/api/goods2/";
    var usersUrl = "https://5d668943520e1b00141ee3bd.mockapi.io/api/users";

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
                case "read"  : options.url = mockBaseUrl;                     break; 
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


    var User =  Backbone.Model.extend({
        defaults: function() {
            return {
                username: "default username",
                password: "default password",
                isAuth: false
            };
        },
        isNew(){
            return this.get("id") ? false : true;
        },
        url: usersUrl,
        urlRoot: function(){
            return usersUrl 
        },
        sync: function(method, model, options){
            switch(method){
                case "read"  : options.url = usersUrl;                    break; 
                case "update": options.url = usersUrl + model.get("id");  break; 
                case "delete": options.url = usersUrl + model.get("id");  break; 
                case "create": options.url = usersUrl;                    break; 
            }
            return Backbone.sync(method, model, options);
        },
        login: function() {
            this.model.set("isAuth", true);
            this.model.save();
        },
        logout: function() {
            this.model.set("isAuth", false);
            this.model.save();
        }
    })



    var UserList = Backbone.Collection.extend({
        url: usersUrl,
        model: User,
        comparator: "id",
        sync: function(method, model, options){
            switch(method){
                case "read"  : options.url = usersUrl;                    break; 
                case "update": options.url = usersUrl + model.get("id");  break; 
                case "delete": options.url = usersUrl + model.get("id");  break; 
                case "create": options.url = usersUrl;                    break; 
            }
            return Backbone.sync(method, model, options);
        },
        initialize: function(){
            this.fetch();
        },
        findUser: function(username, password){
          return this.where({ username: username, password: password })
        }
    });
    var users = new UserList();


    var LoginView = Backbone.View.extend({
        model: User,
        el: ".login",
        template: _.template($('#login-template').html()),
        events: {
            "submit form" : "login"
        },
        login: function(){
            var isLogin = false;
            users.each(function(model){
                var username = $("#loginUsername").val();
                var password = $("#loginPassword").val();
                if(model.get("username") == username
                 && model.get("password") == password){
                     isLogin = true;
                     localStorage.setItem("username", username);
                     localStorage.setItem("password", password);
                 }
            })
            console.log(isLogin);
            return isLogin;
        },
        render: function(){
            this.$el.html(this.template());
            return this;
        },
        initialize: function(){
            this.render();
            return this;
        }
    })

    var RegistrationView = Backbone.View.extend({
        model: User,
        el: ".registration",
        template: _.template($("#registration-template").html()),
        events: {
            "submit form" : "regist"
        },
        regist: function(){
          var username = $("#regUsername").val();
          var password = $("#regPassword").val();
          users.create({ 
            username: username,
            password: password,
            isAuth: false
           });
           localStorage.setItem("username", username);
           localStorage.setItem("password", password);
        },
        render: function(){
            this.$el.html(this.template());
            return this;
        },
        initialize: function(){
            this.render();
            return this;
        }
    })

     




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
     carts.fetch();


var CartView = Backbone.View.extend({
     el: $("#cart-list"), 
    // tagName: 'ul',
    // template: _.template($("#cart-template").html()),
    events: {
        "click a.destroy" : "clear",
    },
    render: function(){
    var view = "";
    $("#cart-list").empty();
        carts.each(function(model){
            view = "<li class='list-group-item' id='" +  model.get("id")  +  "'>" +
             "<label class='title'>"  + model.get("title") + "</label>" +
             "<label class='price'>"  + model.get("price") + " $ </label>" +
             "<a class='destroy'></a>" +
             "</li>"; 
          //  console.log($('ul.list-group'));
            $("ul.list-group").append(view);
        })
        $("ul.list-group").append("<h3 class='total'>Total: " + this.calculateTotal() + " $</h3>");
        return this;
    },
    initialize: function(){
        this.listenTo(carts, 'add', this.render);
      //  this.listenTo(carts, 'remove', this.remove);
        this.render();
        return this;
    },
    calculateTotal: function(){
        var sum = 0;
        carts.each(function(model){
            sum += parseInt(model.get("price"));
        })
        return sum;
    },
    clear: function(e) {
        var model =  carts.get(e.currentTarget.parentElement.id)
        model.destroy();
        this.render();
        console.log(carts)
    }  
})



   


    var GoodsList = Backbone.PageableCollection.extend({
        url: mockBaseUrl,
        model: Goods,
        mode: "server",
        comparator: 'id',
        state: {
          pageSize: 20,
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
            "click #addToCart" : "addToCart",
            "click img"        : "showItem"
        },
        initialize: function() {

        },
        showItem: function(){
          router.navigate("/goods/" + this.model.id, {trigger: true});
        },
        addToCart: function(){
          console.log("addToCart");
            carts.create({ 
                title: this.model.get("title"), 
                price: this.model.get("price")
             }); 
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

    var GoodsItemView = Backbone.View.extend({
        model: Goods,
        el: $("#cart-item"),
        template: _.template($("#goodsItem-template").html()),
        render: function(){
            this.$el.html(this.template(this.model.toJSON()))
            return this;
        },
        initialize: function(){
            this.render();
            return this;
        }
    })

    var myRouter = Backbone.Router.extend({
        routes: {
          "login":                 "login",    
          "logout":                 "logout", 
          "registration":            "registration", 
          "goods/:id":          "goods",
          "goods":                 "goods", 
          "cart":                 "cart", 
          "*default":           "default"
        },
        default: function(){
            this.navigate("/login", {trigger: true});
            console.log("default router");
        },
        login: function() {
            this.clear();
            $(".shopModuleApp").hide();
            new LoginView();
        },
        logout: function() {
            this.navigate("/login", {trigger: true});
            localStorage.removeItem("username");
            localStorage.removeItem("password");
        },
        registration: function() {
            this.clear();
            $(".shopModuleApp").hide();
            new RegistrationView();
        },
        goods: function(id) {
            if( !this.userIsAuth()){
                this.navigate("/login", {trigger: true});
                return;
            }
            if(id){
                $(".shopModuleApp").hide();
               var g = goods.findWhere({ id: id }); 
               new GoodsItemView({ model: g });
               return;
            }
            this.clear();
            $(".shopModuleApp").show();
            new AppView();
        },
        cart: function() {
            if( !this.userIsAuth()){
             this.navigate("/login",  {trigger: true});
             return;
            }
            this.clear();
            $(".shopModuleApp").hide();
            console.log("cart router");
            new CartView();
        },
        notFound: function(){
            console.log("url not found 404 error");
        },
        initialize: function(){
            Backbone.history.start();
        },
        clear: function(){
         $(".shopModule").empty();
        },
        userIsAuth: function(){
            if(localStorage.getItem("username") == null) return false;
            var username = localStorage.getItem("username");
            var password = localStorage.getItem("password");
            var isAuth = false;
            users.each(function(model){
                if(model.get("username") == username &&
                   model.get("password") == password){
                       isAuth = true;
                   } 
            })
            console.log("userIsAuth   " + isAuth);
            return isAuth;
        }
    
      });

    

    var router = new myRouter();
      

});