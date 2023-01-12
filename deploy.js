console.group('Doh Initial Build');
// this is a cheat, but it keeps us from messing with top here.
let meld_objects = function(destination){
  destination = destination || {}; // this may seem unneccesary but OH IS IT EVER NECCESSARY
  var obj, i;
  for(var arg in arguments){
    obj = arguments[arg];
    if(obj === destination) continue;
    i = '';
    for(i in obj){
      destination[i] = obj[i];
    }
  }
  return destination;
};



// simply add a property to DohWatch with a reference to the object you want "watched"
// DohWatch.MyWatchedName = MyWatchedObject;
var DohWatch = DohWatch || {top:top};
// A global store of diffs between each DohWatchUpdate()
// keyed by MyWatchedName
var DohWatchDiffs = {};

// WARNING: THIS WILL BE SLOW. USE WITH CAUTION!
// name can be any string, it is appended to the DohWatchUpdate.CacheCounter so that each Update is unique
var DohWatchUpdate = function(name){
  var diffName, lastWatchEntry, currentWatchEntry;

  // always clean and define before starting
  DohWatchUpdate.CacheCounter += 1;
  
  diffName = DohWatchUpdate.CacheCounter + ' ' + name;
  
  for(var watching in DohWatch){
    DohWatchUpdate.Cache[watching] = DohWatchUpdate.Cache[watching] || {};
    
    DohWatchDiffs[watching] = DohWatchDiffs[watching] || {};
    DohWatchDiffs[watching][diffName] = {};
    
    // get last and current entries for top
    lastWatchEntry = DohWatchUpdate.Cache[watching][DohWatchUpdate.PreviousName];
    // this is where we make the new cache entry
    currentWatchEntry = DohWatchUpdate.Cache[watching][diffName] = meld_objects({}, DohWatch[watching]);
    
    // build DohWatchDiffs[watching][propName] so we can see what's changed between saves
    if(lastWatchEntry){
      for (var propName in currentWatchEntry){
        if(typeof lastWatchEntry[propName] === 'undefined'){
          // current top has a property that last top doesn't
          DohWatchDiffs[watching][diffName][propName] = currentWatchEntry[propName];
          continue;
        }
        if(lastWatchEntry[propName] != currentWatchEntry[propName]){
          // current top has changed a property since last top.
          // we need this because all writes to top is what we are watching
          DohWatchDiffs[watching][diffName][propName] = currentWatchEntry[propName];
        }
      }
    }
  }
  // set us as last to move the pointer forward
  DohWatchUpdate.PreviousName = diffName;
}
// A counter for the number of times DohWatchUpdate() is called
DohWatchUpdate.CacheCounter = DohWatchUpdate.CacheCounter || 0;
// A local store of watched objects
// keyed by MyWatchedName
DohWatchUpdate.Cache = {};
// A Global of the last name that was used to update DohWatch
DohWatchUpdate.PreviousName = '';


// this is fast and will impact nothing
//DohWatchUpdate = function(name){};

// 
DohWatchUpdate('init');
// hand populate the initial cache diff with our DohWatch stuff since we can't record it until after it's happened
DohWatchDiffs.top['1 init'] = {DohWatch:DohWatch,DohWatchDiffs:DohWatchDiffs,DohWatchUpdate:DohWatchUpdate};

/*
 * Libraries and Polyfills related to deploy.js
 */

// poly-fill a Function.bind() method because without it, we don't work.
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

/**
 * Script loading is difficult thanks to IE. We need callbacks to fire
 * immediately following the script's execution, with no other scripts
 * running in between. If other scripts on the page are able to run
 * between our script and its callback, bad things can happen, such as
 * `jQuery.noConflict` not being called in time, resulting in plugins
 * latching onto our version of jQuery, etc.
 *
 * For IE<10 we use a relatively well-documented "preloading" strategy,
 * which ensures that the script is ready to execute *before* appending
 * it to the DOM. That way when it is finally appended, it is
 * executed immediately.
 *
 * References:
 * - http://www.html5rocks.com/en/tutorials/speed/script-loading/
 * - http://blog.getify.com/ie11-please-bring-real-script-preloading-back/
 * - https://github.com/jrburke/requirejs/issues/526
 * - https://connect.microsoft.com/IE/feedback/details/729164/
 *           ie10-dynamic-script-element-fires-loaded-readystate-prematurely
 */
(function () {

  // Global state.
  var pendingScripts = {};
  var scriptCounter = 0;


  /**
   * Insert script into the DOM
   *
   * @param {Object} script Script DOM object
   * @returns {void}
   */
  var _addScript = function (script) {
    // Get the first script element, we're just going to use it
    // as a reference for where to insert ours. Do NOT try to do
    // this just once at the top and then re-use the same script
    // as a reference later. Some weird loaders *remove* script
    // elements after the browser has executed their contents,
    // so the same reference might not have a parentNode later.
    var firstScript = document.getElementsByTagName("script")[0];

    // Append the script to the DOM, triggering execution.
    //DohWatchUpdate('--------------- ' + ' Before ' + script.src);
    firstScript.parentNode.insertBefore(script, firstScript);
    //DohWatchUpdate(script.src);
  };

  /**
   * Load Script.
   *
   * @param {String}            src       URI of script
   * @param {Function|Object}   callback  (Optional) Called on script load completion,
   *                                      or options object
   * @param {Object}            context   (Optional) Callback context (`this`)
   * @returns {void}
   */
  var _lload = function (src, callback, context) {
    /*eslint max-statements: [2, 32]*/
    var setup;

    if (callback && typeof callback !== "function") {
      context = callback.context || context;
      setup = callback.setup;
      callback = callback.callback;
    }

    var script = document.createElement("script");
    var done = false;
    var err;
    var _cleanup; // _must_ be set below.

    /**
     * Final handler for error or completion.
     *
     * **Note**: Will only be called _once_.
     *
     * @returns {void}
     */
    var _finish = function () {
      // Only call once.
      if (done) { return; }
      done = true;

      // Internal cleanup.
      _cleanup();

      // Callback.
      if (callback) {
        callback.call(context, err);
      }
    };

    /**
     * Error handler
     *
     * @returns {void}
     */
    var _error = function () {
      err = new Error(src || "EMPTY");
      _finish();
    };

    if (script.readyState && !("async" in script)) {
      /*eslint-disable consistent-return*/

      // This section is only for IE<10. Some other old browsers may
      // satisfy the above condition and enter this branch, but we don't
      // support those browsers anyway.

      var id = scriptCounter++;
      var isReady = { loaded: true, complete: true };
      var inserted = false;

      // Clear out listeners, state.
      _cleanup = function () {
        script.onreadystatechange = script.onerror = null;
        pendingScripts[id] = void 0;
      };

      // Attach the handler before setting src, otherwise we might
      // miss events (consider that IE could fire them synchronously
      // upon setting src, for example).
      script.onreadystatechange = function () {
        var firstState = script.readyState;

        // Protect against any errors from state change randomness.
        if (err) { return; }

        if (!inserted && isReady[firstState]) {
          inserted = true;

          // Append to DOM.
          _addScript(script);
        }

        // --------------------------------------------------------------------
        //                       GLORIOUS IE8 HACKAGE!!!
        // --------------------------------------------------------------------
        //
        // Oh IE8, how you disappoint. IE8 won't call `script.onerror`, so
        // we have to resort to drastic measures.
        // See, e.g. http://www.quirksmode.org/dom/events/error.html#t02
        //
        // As with all things development, there's a Stack Overflow comment that
        // asserts the following combinations of state changes in IE8 indicate a
        // script load error. And crazily, it seems to work!
        //
        // http://stackoverflow.com/a/18840568/741892
        //
        // The `script.readyState` transitions we're interested are:
        //
        // * If state starts as `loaded`
        // * Call `script.children`, which _should_ change state to `complete`
        // * If state is now `loading`, then **we have a load error**
        //
        // For the reader's amusement, here is HeadJS's catalog of various
        // `readyState` transitions in normal operation for IE:
        // https://github.com/headjs/headjs/blob/master/src/2.0.0/load.js#L379-L419
        if (firstState === "loaded") {
          // The act of accessing the property should change the script's
          // `readyState`.
          //
          // And, oh yeah, this hack is so hacky-ish we need the following
          // eslint disable...
          /*eslint-disable no-unused-expressions*/
          script.children;
          /*eslint-enable no-unused-expressions*/

          if (script.readyState === "loading") {
            // State transitions indicate we've hit the load error.
            //
            // **Note**: We are not intending to _return_ a value, just have
            // a shorter short-circuit code path here.
            return _error();
          }
        }

        // It's possible for readyState to be "complete" immediately
        // after we insert (and execute) the script in the branch
        // above. So check readyState again here and react without
        // waiting for another onreadystatechange.
        if (script.readyState === "complete") {
          _finish();
        }
      };

      // Onerror handler _may_ work here.
      script.onerror = _error;

      // Since we're not appending the script to the DOM yet, the
      // reference to our script element might get garbage collected
      // when this function ends, without onreadystatechange ever being
      // fired. This has been witnessed to happen. Adding it to
      // `pendingScripts` ensures this can't happen.
      pendingScripts[id] = script;

      // call the setup callback to mutate the script tag
      if (setup) {
        setup.call(context, script);
      }

      // This triggers a request for the script, but its contents won't
      // be executed until we append it to the DOM.
      script.src = src;

      // In some cases, the readyState is already "loaded" immediately
      // after setting src. It's a lie! Don't append to the DOM until
      // the onreadystatechange event says so.

    } else {
      // This section is for modern browsers, including IE10+.

      // Clear out listeners.
      _cleanup = function () {
        script.onload = script.onerror = null;
      };

      script.onerror = _error;
      script.onload = _finish;
      script.async = true;
      script.charset = "utf-8";

      // call the setup callback to mutate the script tag
      if (setup) {
        setup.call(context, script);
      }

      script.src = src;

      // Append to DOM.
      _addScript(script);
    }
  };

  // UMD wrapper.
  /*global define:false*/
  if (typeof exports === "object" && typeof module === "object") {
    // CommonJS
    module.exports = _lload;

  } else if (typeof define === "function" && define.amd) {
    // AMD
    define([], function () { return _lload; });

  } else {
    // VanillaJS
    window._lload = _lload;
  }
}());

window._loadcss = function(url, callback){
  var html_link = document.createElement('link');
  html_link.type = 'text/css';
  html_link.rel = 'stylesheet';
  html_link.onload = callback;
  html_link.href = url;
  document.head.appendChild(html_link);
}

DohWatchUpdate('After Little Loaders');

// a subpath to load doh from
// specifically overloadable so we can define it prior to deploy.js
window.LoadDohFrom = window.LoadDohFrom || '';

// if LoadDohBundles is already defined, then use
// that to prep Doh. This allows apps to pre-load
// their own bundles and disable core features.
// we enclose this in a self-calling function to keep local vars from
// polluting top
(function(){
  var LDB = window.LoadDohBundles,
  default_bundles = {
    JQUERYCORE:{
      "https://code.jquery.com/jquery-3.6.3.min.js":false,
    },
    CSSRESET:{
      // core css contains a sizing reset that everything else depends on
      "/doh_js/patterns.css":false,
    },
    JQUERYUI:{
      "https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css":false,
      "https://code.jquery.com/ui/1.12.1/jquery-ui.min.js":false,
    },
    CORE:{
      "/doh_js/patterns":false,
    },
  };
  if(!LDB){
    // LoadDohBundles is falsy, we need it to be the default core bundles
    window.LoadDohBundles = default_bundles;
  } else if(typeof LDB === 'string'){
    // We are using LoadDohBundles to tell us which core bundles to skip
    
    // we need it to be an object full of default core bundles, so we build that here
    window.LoadDohBundles = {};
    for(var i in default_bundles){
      if(LDB.indexOf('SKIP'+i) == -1) window.LoadDohBundles[i] = default_bundles[i];
    }
  }
  // by this point, LoadDohBundles will have existed before as a string of skips, or 
  // an object of bundles, or a malformed object (test for this later), or it didn't
  // exist and we had to create it
  // after this, it will be an object of bundles or a malformed object
})();

// Create the Doh Global Object. This should be a plain object in the global scope
// do NOT put this directly on top, let it bubble up.
// do NOT allow this to be overloaded, create it explicitly here.
Doh = {
  // This seems silly, but first-tier scripts (in the initial <head>) will
  // have access to Doh and OnLoad BEFORE Doh has finished loading, or
  // even before Doh has been told to load
  // Doh is not loaded yet
  IsLoaded: false,
  // Doh is not loading yet, either
  IsLoading: false,

  // store scripts we've loaded so we don't duplicate
  ScriptIsLoaded: {},
  // maintain a queue of callbacks for each script loading 
  // NOTE: these should usually be empty
  ScriptIsLoadedQueue: {},

  // a list of loaded modules keyed by module name
  ModuleIsLoaded: {},
  // a list of modules that try to run before Doh.IsLoaded
  // NOTE: these should usually be empty
  // Temp containers for queues of callbacks that are waiting on modules to load
  ModuleIsLoadedQueue: {},
  //  a list of module dependencies keyed by module name
  ModuleRequires: {},
  // a list of modules that require the keyed module name
  ModuleRequiredBy: {},
  // a list of modules that were loaded BEFORE load_doh
  // this will be any modules that exist in script tags in the initial html head
  ModuleWasDeferred: {},
  // the name of the module that is actively running it's OnLoad()
  // otherwise set to false
  ModuleCurrentlyRunning: false,
  
  Globals:{},
  
  // turn an array of script source paths into a loadable bundle of bundles
  create_load_bundle_from_array: function(arr, name){
    name = name || 'Array';
    let bundles = {};
    bundles[name] = {};
    for(let i in arr){
      if(i !== 'length'){
        bundles[name][arr[i]] = false;
      }
    }
    return bundles;
  },

  //load a script, run callback when finished, set context to 'this' in callback
  // will NOT load the same script twice. once a script has been requestsd, further
  // attempts to load the same script, even during the time it is being fetched
  // will queue the callback and wait for the first load to finish.
  load_script: function(src, callback, context){
    context = context || {src:src,callback:callback};
    //Doh.ScriptIsLoaded[src] = false;
    //var queue = [],
    // bind the context to the callback
    this.ScriptIsLoadedQueue[src] = this.ScriptIsLoadedQueue[src] || [];
    var callback_wrapper = function(){
      //console.log('load_script callback wrapper for', src, 'with context', context);
      if(callback) callback.call(context);
    },
    // use an internal callback to note the script having been loaded
    internal_callback = function(){
      // call the callback_wrapper
      //setTimeout(callback_wrapper,1);
      //Doh.ScriptIsLoaded will be false because we are the callback from script loading.
      // we set it to false to indicate that the script is loading.
      if(Doh.ScriptIsLoaded[src] === false){
        // the script is loaded, note this
        //console.log('Loaded script:', src);
        callback_wrapper();
        //console.log('load_script running queue for:', src, Doh.ScriptIsLoadedQueue[src]);
        // now that the first callback has run, run the queue
        for(var i = 0; i<Doh.ScriptIsLoadedQueue[src].length; i++){
          //setTimeout(queue[i],1);
          Doh.ScriptIsLoadedQueue[src][i]();
        }
        // always empty the queue if we run it
        Doh.ScriptIsLoadedQueue[src] = [];
        // indicate that the script is done loading and running it's queue
        Doh.ScriptIsLoaded[src] = true;
      } else throw console.error('ERROR: load_script: called an internal callback on an already loaded script');
    };
    // if it's not already loaded, or set to false (currently loading)
    if(!this.ScriptIsLoaded[src] && this.ScriptIsLoaded[src] !== false){
      // set to false to indicate the script is currently loading
      this.ScriptIsLoaded[src] = false;
      //console.log('load_script: ',src);
      // setup a holder for extension manipulation
      var _src = src;
      // add LoadDohFrom to all loadded assets
      if(_src.indexOf('/') === 0){
        //console.log('Load ', _src, 'from Doh root slash: "', (LoadDohFrom || '/'), '"');
        if(LoadDohFrom){
          _src = LoadDohFrom + _src;
        }
      }
      //console.log('load_script: ',_src);
      // handle .css files
      if(src.indexOf('.css') == src.length - 4){
        // css is always considered loaded because our loader
        // only calls the callback once the css has been consumed
        this.ModuleIsLoaded[context.src || src] = true;
        
        window._loadcss(_src, internal_callback);
      } else { // handle js files
        // add .js extension to named Doh modules
        if(src.lastIndexOf('.js') != src.length - 3){
          // add manifest handling here
          
          _src = _src + '.js';
        } else {
          // this is a non-Doh module, assume it is loaded once executed
          // use the 'src' from the passed in context, if available
          this.ModuleIsLoaded[context.src || src] = true;
        }
        // let little loader do it's thing
        window._lload(_src, internal_callback, context);
      }
    } else if(this.ScriptIsLoaded[src] === false){
      //stash the bound callback to be called when the script loads
      if(context) if(context.bundle){
        //console.log('load_script:', context.bundle, 'is waiting on', src, 'to load'); // this one  is helpful for diagnosing
      } else {
        console.log('load_script is waiting for', src, 'to load');
      }
      this.ScriptIsLoadedQueue[src] = this.ScriptIsLoadedQueue[src] || [];
      this.ScriptIsLoadedQueue[src].push(callback_wrapper);
    } else if(this.ScriptIsLoaded[src] === true){
      //console.log('load_script:', src, 'is already loaded');
      // call the callback_wrapper
      //setTimeout(callback_wrapper,1);
      callback_wrapper();
    }
  },

  // Accept a list of bundles (bundle of bundles) and try to load them, in order
  load_bundles: function(bundles, callback){
    var last_bundle = false, 
    current_bundle = false, 
    next_is_current = false, 
    callback_has_run = false,
    run_next_bundle = function(){
      next_is_current = false;
      for(let bundle in bundles){
        if(last_bundle === false){
          //console.log('last is false');
          current_bundle = bundle;
        } else {
          if(bundle === last_bundle){
            //console.log(bundle, 'is last_bundle');
            next_is_current = true;
            continue;
          } else if(next_is_current){
            //console.log(bundle, 'is next_is_current');
            current_bundle = bundle;
          }
        }
        if(bundle === current_bundle){
          if(bundle === 'JQUERYCORE') {
            console.log('Doh is auto-loading jQuery: ', Object.keys(bundles[bundle])[0]);
          }
          //console.log('Loading bundle: ', bundle);
          for(let src in bundles[bundle]){
            if(Doh.ModuleIsLoaded[src] === false){
              //the module is loading or loaded
              //console.log(bundle, 'bundle thinks the module', src, 'is loading');
              internal_callback.call({
                internal_callback:internal_callback,
                bundles:bundles,
                bundle:bundle,
                src:src
              });
            } else {
              //console.log(bundle, 'bundle thinks', src, 'needs to load');
              Doh.load_script(src, internal_callback, {
                internal_callback:internal_callback,
                bundles:bundles,
                bundle:bundle,
                src:src
              });
            }
          }
          //console.log('setting', bundle, 'to last_bundle');
          current_bundle = false;
          last_bundle = bundle;
          return true;
        }
      }
      // if we make it here then we are out of bundles
      //console.log('no remaining bundles');
      if(!callback_has_run){
        //console.log('Loaded last bundle from: ', bundles);
        callback_has_run = true;
        //setTimeout(callback,1);
        callback();
      } else {
        //console.log('callback has already run');
      }
      return false;
    }, 
    check_bundle = function(){
      // 'this' is the small object we create and send to _lload
      //console.log(this.src, 'has loaded from bundle:', this.bundles[this.bundle]);
      for(let src in this.bundles[this.bundle]){
        if(this.bundles[this.bundle][src] !== true){
          //the bundle is not done, wait
          //console.log(this.bundle, 'bundle is still loading ',src);
          return false;
        }
      }
      //the bundle is done, run next
      //console.log(this.bundle, 'bundle has loaded');
      run_next_bundle();
      return true;
    }, 
    internal_callback = function(err){
      // 'this' is the small object we create and send to _lload
      // we believe this to mean that the script is loaded, unsure about the callback
      var that = this;
      var onmoduleisloaded_callback = function(){
        //console.log(that.src, 'has loaded in bundle', that.bundle);
        that.bundles[that.bundle][that.src] = true;
        check_bundle.call(that);
      };
      //console.log(this.bundle, 'is waiting on', this.src); // helpful
      Doh.when_module_has_loaded(this.src, onmoduleisloaded_callback);
    };
    run_next_bundle();
  },

  // set a callback that will execute when module_name has completely loaded
  // primarily used by load_bundles
  when_module_has_loaded: function(module_name, callback){
    if(this.ModuleIsLoaded[module_name] === true){
      //console.log('Doh.when_module_has_loaded:', module_name, 'has already loaded');
      // the module has loaded
      setTimeout(callback,1);
      //callback();
    } else if(!this.ModuleIsLoaded[module_name] || this.ModuleIsLoaded[module_name] === false){
      //console.log('Doh.when_module_has_loaded:', module_name, 'has not yet loaded');
      // the module is loading
      this.ModuleIsLoadedQueue[module_name] = this.ModuleIsLoadedQueue[module_name] || [];
      this.ModuleIsLoadedQueue[module_name].push(callback);
    }
  },

  // runs after all the initial scripts have been fetched and processed
  // goes through the list of this.ModuleWasDeferred and runs them, then clears the list
  load_doh_finale: function(){
    
    if(Doh.IsLoaded){
      // modules are already loaded, don't reload
      console.warn('WARNING: Doh.load_doh_finale called after Doh finished loading.');
      return;
    }
    
    // Doh is not loaded, is it loading?
    if(Doh.IsLoading){
      Doh.IsLoaded = true;
      Doh.IsLoading = false;
    } else {
      // Doh is neither loading, nor loaded
      console.warn('WARNING: Doh.load_doh_finale called while Doh is NOT loading OR loaded.');
      return;
    }
    
    Doh.jQuery(function($){
      DohWatchUpdate('After Doh core has loaded');
      // run deferred modules, 
      for(var module_name in Doh.ModuleWasDeferred) {
        // this call is to a closure wrapper around the actual callback
        Doh.ModuleWasDeferred[module_name]();
      }
      console.log("Doh: deferred the loading of: ", Doh.ModuleWasDeferred);
      Doh.ModuleWasDeferred = {};
      console.groupEnd();
    });
  },

  // release jQuery globals, reset_all will prevent some jquery plugins from loading.
  // use AFTER all desired jquery plugins have loaded.
  no_conflict_jQuery: function(reset_all){
    // return jquery globals to their previous owners
    this.jQuery.noConflict(reset_all);
    if(reset_all) console.log('Doh: returned jQuery to version: ', jQuery.fn.jquery);
  },

  // Load Doh using LoadDohBundles, run Doh.load_doh_finale after core bundles have run
  // defer any modules loaded prior to Doh finishing.
  load_doh: function(){
    if(!Doh.IsLoaded && !Doh.IsLoading){
      console.log('Doh: IsLoading...');
      Doh.IsLoading = true;
      
      Doh.load_bundles(LoadDohBundles, Doh.load_doh_finale);
    } else {
      console.warn('WARNING: load_doh called while Doh is already loaded or loading');
    }
  }
};
// load_script handles CSS, but we don't know that this will always be the case
Doh.load_css = Doh.load_script;

// We always add Doh and glob to DohWatch. It was created to expose global namespace pollution.      
DohWatch.Doh = Doh;


// a method for running a named module, with requirements
// always process requires, wait for Doh to load, then run callback
// can be overloaded to allow skipping the load process
window.OnLoad = window.OnLoad || function(module_name, requires, callback, globals){
  // mark the module as loading with explicit false
  if(Doh.ModuleIsLoaded[module_name]) {
    throw console.error('FATAL: two OnLoad functions for the same module:', module_name);
    return;
  }
  else Doh.ModuleIsLoaded[module_name] = false;
  // localize the callback we will use
  if(!Array.isArray(requires)){
    // if we didn't send an array, then the second argument should be the callback to run onLoad
    globals = callback;
    callback = requires;
  }
  // allow Doh to manage new globals so they get automatically watched:
  // allow globals to be a string
  if (typeof globals === 'string') {
    Doh.Globals[globals] = Doh.Globals[globals] || {};
    window[globals] = DohWatch[globals] = Doh.Globals[globals];
  }
  // or an array-like object
  else if (typeof globals !== 'undefined'){
    for(var i in globals){
      if (i !== 'length'){
        // allow the array structure to have the pattern name in key
        if(isNaN(i)){
          Doh.Globals[i] = true;
          Doh.Globals[i] = Doh.Globals[i] || {};
          window[i] = DohWatch[i] = Doh.Globals[i];
        }
        // or in the value
        else {
          Doh.Globals[globals[i]] = true;
          Doh.Globals[globals[i]] = Doh.Globals[globals[i]] || {};
          window[globals[i]] = DohWatch[globals[i]] = Doh.Globals[globals[i]];
        }
      }
    }
  }
      
  // bind our callback
  // and second, the actual module updating one for later
  var module_callback = function(){
    if(!Doh.ModuleIsLoaded[module_name]){
      //console.log('running module:', module_name);
      DohWatchUpdate('--------------- Between ' + DohWatchUpdate.PreviousName + ' and ' + module_name);
      Doh.ModuleCurrentlyRunning = module_name;
      try{
        if(!Doh.jQuery){
          // find our jQuery version
          Doh.jQuery = jQuery;
          console.log('Doh was given jQuery version: ', Doh.jQuery.fn.jquery);
        }
        callback(Doh.jQuery);
        Doh.ModuleCurrentlyRunning = false;
        DohWatchUpdate(module_name);
      } catch (err) {
        Doh.ModuleCurrentlyRunning = false;
        console.error('OnLoad: running original callback for', module_name, 'failed with error', err);
        DohWatchUpdate(module_name);
        // don't carry on with callbacks for dependents because we failed to be dependable.
        return;
      }
      Doh.ModuleCurrentlyRunning = false;
      //setTimeout(function(){
        //console.log('Running Doh.ModuleIsLoadedQueue for:', module_name, Doh.ModuleIsLoadedQueue[module_name]);
        if(Doh.ModuleIsLoadedQueue[module_name]){
          for(var i in Doh.ModuleIsLoadedQueue[module_name]){
            if(i != 'length'){
              //setTimeout(Doh.ModuleIsLoadedQueue[module_name][i],1);
              Doh.ModuleIsLoadedQueue[module_name][i]();
            }
          }
          Doh.ModuleIsLoadedQueue[module_name] = [];
        }
        //console.log('Loaded module:', module_name);
        Doh.ModuleIsLoaded[module_name] = true;
      //},2);
    }
  };
  // if we are requiring an array of things, use the Require method
  if(Array.isArray(requires)){
    // if we are requiring, return now and let that system handle concurrency
    window.OnLoad.require(module_name, requires, module_callback);
    return;
  } else {
    Doh.ModuleRequires[module_name] = [];
  }
  // OnLoad only for loading after Doh
  // core modules MUST live in /doh_js/
  // core modules MUST NOT have requirements
  if(Doh.IsLoaded || module_name.indexOf('/doh_js/') === 0){
    setTimeout(module_callback,1);
  } else { // Doh is not loaded
    // stash our function for later
    Doh.ModuleWasDeferred[module_name] = module_callback;
    
    if(!Doh.IsLoaded && !Doh.IsLoading){
      // as long as we aren't skipping, LoadDoh
      if(!SKIPLOADDOH) Doh.load_doh();
    }
  }
}
// define a named module that requires a script, or list of scripts and
// expects to be callback'ed when they have all loaded completely
// !!!DO NOT USE THIS, USE OnLoad INSTEAD!!!
window.OnLoad.require = function(module_name, src, callback){
  //console.log(module_name, 'Requires', src);
  if(!Array.isArray(src)){
    src = [src];
  }
  if(Doh.IsLoaded){
    var bundle = Doh.create_load_bundle_from_array(
        src, 
        module_name+'_Requires'
      );
    if(!Doh.ModuleRequires[module_name]){
      // store module requirements
      Doh.ModuleRequires[module_name] = Object.keys(bundle[module_name+'_Requires']);
      // report that module_name requires for each requirement to populate ModuleRequiredBy
      var i = '', required = '';
      for(i in Doh.ModuleRequires[module_name]){
        if(i !== 'length'){
          required = Doh.ModuleRequires[module_name][i];
          Doh.ModuleRequiredBy[required] = Doh.ModuleRequiredBy[required] || [];
          Doh.ModuleRequiredBy[required].push(module_name);
        }
      }
    }
    Doh.load_bundles(
      bundle,
      callback
    );
  } else { // Doh is not loaded
   // console.log('trying to require', src, 'before Doh is loaded');
    Doh.ModuleWasDeferred[module_name] = function(){window.OnLoad.require(module_name, src, callback);};
    
    if(!Doh.IsLoaded && !Doh.IsLoading){
      // as long as we aren't skipping, load_doh
      if(!SKIPLOADDOH) Doh.load_doh();
    }
  }
}

// append LoadDohFrom, if defined, to paths.
// This is the "Doh Root Path" or "Doh Root Slash"
DohPath = function(p) {
  return (window.LoadDohFrom?(window.LoadDohFrom + p):p);
}

// helper method for top cleanup
ShowTopCacheDamage = function() {
  DohWatchUpdate('current');
  console.log('top has ',Object.keys(top).length,'entries!');
}

// A global that allow us to skip the load_doh() call below
var SKIPLOADDOH = window.SKIPLOADDOH || false;

// make sure to include SKIPLOADDOH in our deploy.js WatchUpdate
DohWatchUpdate('deploy.js');
