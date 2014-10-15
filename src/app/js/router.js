define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {

    var AppRouter = Backbone.Router.extend({
        routes: {
            '*sketch': 'default'
        },

        default: function(sketch) {
            if (sketch) {
                require(['../../sketches/?/?'.split('?').join(sketch)], function(view) {
                    view.initialize();
                }, function(err) {
                    console.log('VIEW PROBABLY DOESNT EXIST', err);
                });
            } else {
                console.log("LOAD THE HOME PAGE");
            }
        }
    });
    
    var init = function() {
        var appRouter = new AppRouter();
        Backbone.history.start({ pushState: false });
    };
    
    return {
        initialize: init
    };

});
