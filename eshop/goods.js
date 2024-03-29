$(function() {
    // change it if you change mock api endpoint
    var mockBaseUrl = "https://5d668943520e1b00141ee3bd.mockapi.io/api/goods2/";
    var usersUrl = "https://5d668943520e1b00141ee3bd.mockapi.io/api/users";

    var Goods = Backbone.Model.extend({
        defaults: function() {
            return {
                title: "default good",
                price: 0,
                count: 1,
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
            router.navigate("/goods", { trigger: true })
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
           router.navigate("/goods", { trigger: true });
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
        "change input": "changeCount"
    },
    changeCount: function(e){
       var id = e.currentTarget.parentElement.id;
       console.log( $("#" + id + " > input").val() );
       carts.get(id).set({ count:  $("#" + id + "> input").val() });
    },
    render: function(){
    var view = "";
    $("#cart-list").empty();
        carts.each(function(model){
            view = "<li class='list-group-item' id='" +  model.get("id")  +  "'>" +
             "<label style='font-size: 35px;'>"  + model.get("title") + "</label>" +
             "<label style='font-size: 25px; float: right; margin-right: 25px;'>"  + model.get("price") * model.get("count") + " $ </label>" +
             "<div> Count: </div> <input type='number' class='form-control w-25' style='widht: 35px;' value='" + model.get("count") + "'>"  +
               
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
        this.listenTo(carts, 'change:count', this.render);
      //  this.listenTo(carts, 'remove', this.remove);
        this.render();
        return this;
    },
    calculateTotal: function(){
        var sum = 0;
        carts.each(function(model){
            sum += parseInt(model.get("price")*model.get("count"));
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
      sortKey: "orderBy",
      order: "order",
      directions: {
      "1": "asc",
      "-1": "desc"
     }
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
            "click #addToCart"    : "addToCart",
            "click img"           : "showItem",
            "click h5.card-title" : "showItem"
        },
        initialize: function() {

        },
        showItem: function(){
          router.navigate("/goods/" + this.model.id, {trigger: true});
        },
        addToCart: function(){
         var d = carts.findWhere({ 
            title: this.model.get("title"),
            price: this.model.get("price")
          })
          if(!d){
            carts.create({ 
                title: this.model.get("title"), 
                price: this.model.get("price"),
                count: 1
             });
          }else{
             var c = carts.get(d.id).get("count");
             var mod = carts.get(d.id).set({count: c + 1 });
             mod.save();
          }
             
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
            "click #applySort" : "setSorting"
        },
        setSorting: function(){
            var dir;
             if($("#sortDir").val() == "asc") dir = 1;
             else dir = -1;

            goods.setSorting($("#sortKey").val(), dir);
            this.$("#goods-list").empty();
            goods.getPage(1);
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
          goods.getPage(parseInt(e.currentTarget.innerHTML));
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

    var historyGoods = new GoodsList();

    var HistoryGoodsView = Backbone.View.extend({
        collection: historyGoods,
        el: $("#history-goods"),
        template: _.template($("#historyGoods-template").html()),
        events: {
            "click img"           : "showItemAgain",
            "click h5.card-title" : "showItemAgain"
        },
        showItemAgain: function(){
            console.log("showItemAgain func" + this.model.id);
          //   $(".shopModule").empty();
          //   router.navigate("/goods/" + this.model.id, {trigger: true});
        },
        render: function(){
            var self = this;
            self.$el.append("<h1>Recently viewed: </h1><p></p>");
            self.collection.each(function(model){
                self.$el.append(self.template(model.toJSON()));
            })
            return self;
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
            users.fetch().then(() => {
                if (this.userIsAuth()) {
                    this.changeNav(true);
                    this.navigate("/goods", {trigger: true});
                } else {
                    this.clear();
                    $(".shopModuleApp").hide();
                    new LoginView();
                }
            });
        },
        logout: function() {
            this.navigate("/login", {trigger: true});
            localStorage.removeItem("username");
            localStorage.removeItem("password");
            this.changeNav(false);
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
               historyGoods.push(g);
               if(historyGoods.length > 5)
                historyGoods.shift();
        
               new GoodsItemView({ model: g });
               new HistoryGoodsView({ model: g });
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
            this.changeNav(isAuth);
            console.log("userIsAuth   " + isAuth);
            return isAuth;
        },
        changeNav: function(isAuth){
            if(isAuth){
                $(".authTrue").show();
                $(".authFalse").hide();
            } else {
                $(".authTrue").hide();
                $(".authFalse").show();
            }
        }
    
      });

    

    var router = new myRouter();
      

});