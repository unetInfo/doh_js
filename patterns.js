// this is for loading into a nodejs system
if(typeof global != 'undefined'){
  top = global;
  var Doh = top.Doh = {};
  var glob = top.glob = {};
  var SeeIf = top.SeeIf = {};
  var PatternModuleVictors = top.PatternModuleVictors || {};
}

Doh = Doh || {};

// This has to be very early.
// we try not to use this now that the url paramater is working
//Doh.DebugMode = true;

// this is for being required by a nodejs module
if(typeof exports != 'undefined') {
  exports = top.Doh;
}

/* **** Prepare Doh **** */
// the most important function in Doh:
/**
 *  @brief Shallow-meld multiple objects (arguments) into destination
 *  
 *  @param [in] destination   [object/falsey] the thing to add everrthing else onto. If falsey, a default of {} will be used.
 *  @param [in] ...arguments  [object]        all additional paramaters will be added in the order they are passed so that the last passed will override everyone else.
 *  @return destination
 *  
 *  @details meld_objects is special for a few specific reasons:
 *           1. destination is both modified and returned. This means that passing a plain object 
 *              or falsey value first will make a new shallow-copy of all other paramaters
 *           2. it doesn't loop over destination. This means that meld_objects(object1, object1, object1) will
 *              have no loops and simply return object
 *           3. it has no other special call outs or references, making it very efficient.
 */
Doh.meld_objects = Object.assign;

Doh.old_meld_objects = function(destination = {}){
  var object, i;
  for(let arg in arguments){
    // stash a local reference for speed
    object = arguments[arg];
    // ignore references that are already the same.
    // this keeps us from processing ourself onto ourself
    if(object === destination) continue;
    // reset i
    i = '';
    for(i in object){
      // simple reference copy. This is considered 'shallow' because we don't loop over object[i] if it's an object or array.
      // this is desirable for us because deep copies are hard to control and inefficient.
      // for controlled deep-copy, see Doh.meld_ideas which uses .melded to control nest depth.
      destination[i] = object[i];
    }
  }
  // modify AND return destination, this is crucial to the various design patterns that use meld_objects.
  return destination;
};
//Doh.meld_objects = Doh.old_meld_objects;

OnLoad('/doh_js/see_if', function($){
  // enshrine the definitions of variable states in the SeeIf library
  Doh.meld_objects(SeeIf, {
    /*
     * These have to be in this order because they are the base types for type_of
     * When we loop over SeeIf, we will always catch one of these, so these are the most primitive types
     */
    // undefined refers to objects that have not been defined anywhere in code yet
    IsUndefined:    (value) => {return typeof value === 'undefined' ;},
    // null is supposed to refer to objects that have been defined, but have no value. In truth because of "falsey" values, it can have other meanings
    IsNull:         (value) => {return value === null ;},
    // string refers to values that are actual string datatype
    IsString:       (value) => {return typeof value === 'string' ;},
    // function refers to values that are actual functions
    IsFunction:     (value) => {return typeof value === 'function' ;},
    // boolean refers to values that are actual native boolean datatype
    IsBoolean:      (value) => {return typeof value === 'boolean' ;},
    // Number refers to values that are a number datatype EXCEPT NaN (Not a Number)
    IsNumber:       (value) => {return (typeof value === 'number' && !isNaN(value)) ;},
    // NotNumber refers to values that ARE NOT a number OR ARE NaN (NotaNumber object)
    NotNumber:      (value) => {return (typeof value !== 'number' || isNaN(value)) ;},
    // array refers to values that are actual array datatype
    IsArray:        (value) => {return Array.isArray(value) ;},
    // dohobject refers to values that are a complex objectobject which was built with Doh
    IsDohObject:    (value) => {return (InstanceOf?  InstanceOf(value)  :false) ;},
    // objectobject refers to values that are complex objects with named properties. No literals or arrays. 
    IsObjectObject: (value) => {return (typeof value === 'object' && toString.call(value) == '[object Object]') ;},
    
    /*
     * Now the rest for type_match and regular SeeIf usage
     */
    // defined is supposed to refer to having a usable reference. undefined means without reference. null references are still unusable in JS, so defined nulls should demand special handling
    IsDefined:      (value) => {return (typeof value !== 'undefined' && value !== null) ;},
    // true refers to the binary 1 state (Boolean)
    IsTrue:         (value) => {return value === true ;},
    // false refers to the binary 0 state (Boolean)
    IsFalse:        (value) => {return value === false ;},
    // truey referes to values that equal binary 1, even if represented by a different datatype. Truey values include: True, HasValue, 1...[positive numbers]
    IsTruey:        (value) => {return value?true:false ;},
    // falsey refers to values that equal binary 0, even if represented by a different datatype. Falsey values include: Undefined, Null, False, '', 0, -1...[negative numbers]
    IsFalsey:       (value) => {return value?false:true ;},
    // arraylike refers to values that act like arrays in every way. they can be used by native array methods
    IsArrayLike:    (value) => {return (Array.isArray(value) || ((typeof value !== 'undefined' && value !== null) && typeof value[Symbol.iterator] === 'function') && typeof value.length === 'number' && typeof value !== 'string') ;},
    // iterable refers to values that define a Symbol iterator so that native methods can iterate over them
    IsIterable:     (value) => {return ((typeof value !== 'undefined' && value !== null) && typeof value[Symbol.iterator] === 'function') ;},
    // enumerable refers to values that can be iterated over in a for/in loop
    // all objects can be iterated in a for loop and all arrays are objects too.
    IsEnumerable:   (value) => {return (typeof value === 'object' && value !== null) ;},
    // literal refers to values that are static literals. Strings, booleans, numbers, etc. Basically anything that isn't an object or array. flat values.
    IsLiteral:      (value) => {return (typeof value !== 'object' || value === null) ;},
    // emptyobject refers to values that are objectobject or arraylike but have no properties of their own. Will return true for both {} and [], as well as IsFalsey.
    IsEmptyObject:  (value) => {
      // falsey is a form of empty
      if (SeeIf.IsFalsey(value)) return true;
      // is it an array with keys? fail if so.
      if (value.length && value.length > 0) return false;
      // if this triggers for an Own property, we fail out.
      for (var key in value) { if (hasOwnProperty.call(value, key)) return false; }
      // it's none of the above, so it can only be an object without Own properties
      return true;
    },
    // keysafe refers to values that are safe for use as the key name in a complex objectobject
    IsKeySafe:      (value) => {return (typeof value === 'string' || (typeof value === 'number' && !isNaN(value)) || value === null) ;},
    // emptystring refers to values that are string literals with no contents
    IsEmptyString:  (value) => {return value === '' ;},
    // hasvalue refers to values that are defined and notemptystring. specifically this includes 0 and negative numbers where truey does not.
    HasValue:       (value) => {return ((typeof value !== 'undefined' && value !== null) && value !== '') ;},
    // anything refers to values of any type. it is specifically useful when SeeIf is being used as a filtering library.
    IsAnything:     (value) => {return true ;},
    
    // Not conditions, interestingly different
    NotUndefined:   (value) => {return typeof value !== 'undefined' ;},
    NotDefined:     (value) => {return (typeof value === 'undefined' || value === null) ;},
    NotNull:        (value) => {return value !== null ;},
    NotFalse:       (value) => {return value !== false ;},
    NotTrue:        (value) => {return value !== true ;},
    NotBoolean:     (value) => {return typeof value !== 'boolean' ;},
    NotString:      (value) => {return typeof value !== 'string' ;},
    NotArray:       (value) => {return !Array.isArray(value) ;},
    NotArrayLike:   (value) => {return !(((typeof value !== 'undefined' && value !== null) && typeof value[Symbol.iterator] === 'function') && typeof value.length === 'number' && typeof value !== 'string') ;},
    NotIterable:    (value) => {return !((typeof value !== 'undefined' && value !== null) && typeof value[Symbol.iterator] === 'function') ;},
    NotEnumerable:  (value) => {return typeof value !== 'object' ;},
    NotFunction:    (value) => {return typeof value !== 'function' ;},
    NotLiteral:     (value) => {return typeof value === 'object' ;},
    NotObjectObject:(value) => {return !(typeof value === 'object' && toString.call(value) == '[object Object]') ;},
    NotDohObject:   (value) => {return !InstanceOf(value) ;},
    NotKeySafe:     (value) => {return !(typeof value === 'string' || (typeof value === 'number' && !isNaN(value))) ;},
    NotEmptyString: (value) => {return value !== '' ;},
    NotEmptyObject: (value) => {return !SeeIf.IsEmptyObject(value) ;},
    LacksValue:     (value) => {return (typeof value === 'undefined' || value === null || value === '') ;},
  });
  // some aliases
  Doh.meld_objects(SeeIf, {
    NotDefined:SeeIf.IsUndefined,
    NotFalsey:SeeIf.IsTruey,
    NotTruey:SeeIf.IsFalsey,
    IsSet:SeeIf.IsDefined,
    NotSet:SeeIf.IsUndefined,
  });
}, 'SeeIf');

OnLoad('/doh_js/core', function($){
  
  // if included, we remove SeeIf. It should not be added to
  if(top.DohWatch)if(DohWatch.SeeIf){
    DohWatch.SeeIf = false;
    delete DohWatch.SeeIf;
  }
  
  // build the core!
  Doh.meld_objects(Doh, {
    // in nodejs, the normal OnLoad is replaced with a far simpler one that needs this set for core.
    ModuleCurrentlyRunning: '/doh_js/core',
    // this remains to be updated, Doh still hasn't really grasped versioning
    Version:'2.0a',
    // allow storage of patterns
    Patterns: {},
    // keyed by pattern, the name of the module that made it (or false if made after load)
    PatternModule: {},
    // keyed by pattern, a list of things that inherit from it
    PatternInheritedBy: {},
    // keyed by module, a list of patterns it creates
    ModulePatterns: {},
    /**
     *  a collection of functions to validate compatibility of a melded property
     *  with it's contents
     */
    MeldedTypeMatch: {
      'method':SeeIf.IsFunction,
        'phase':SeeIf.IsFunction,
      'exclusive':SeeIf.IsAnything,
      'static_reference':SeeIf.IsEnumerable,
      'object':SeeIf.IsObjectObject,
        'idea':SeeIf.IsObjectObject,
      'array':SeeIf.IsArray,
    },
    /**
     *  Default values used by New to provide automatic defaults for melded properties
     */
    MeldedTypeDefault:{
      'method':function(){},
        'phase':function(){},
      'object':{},
        'idea':{},
      'array':[],
    },
    
    /**
     *  @brief return the SeeIf primative for value
     *  
     *  @param [in] value [any] thing to find the type of
     *  @return the string name of a SeeIf method that describes the primative for this type of value
     *  
     *  @details Attempts to provide a consistent typeof for javascript primatives
     *  
     *    Doh.type_of()
     *                'IsUndefined'
     *    Doh.type_of('')
     *                'IsString'
     *    Doh.type_of(0)
     *                'IsNumber'
     *    Doh.type_of(false)
     *                'IsBoolean'
     *    Doh.type_of(null)
     *                'IsNull'
     *    Doh.type_of([])
     *                'IsArray'
     *    Doh.type_of({})
     *                'IsObjectObject'
     *    Doh.type_of(function(){})
     *                'IsFunction'
     *    Doh.type_of(unet.uNetNodes['1-1'])
     *                'IsDohObject'
     */
    type_of: function(value){
      let type;
      for(type in SeeIf){
        if(SeeIf[type](value)){
          return type;
        }
      }
      // SeeIf can't see it, so it's not defined
      // this should never be possible
      throw Doh.error("SeeIf couldn't find a type for:'",value,"'");
      return undefined;
    },
    
    /**
     *  @brief Match value against melded types and SeeIf to find out if it matches
     *         a melded type or SeeIf method
     *  
     *  @param [in] value [any] thing to match against
     *  @param [in] is    [string] name of melded type or SeeIf method
     *  @return true if value == is()
     *  
     *  @details 
     */
    type_match: function(value, is){
      if(typeof Doh.MeldedTypeMatch[is] === 'function')
        return Doh.MeldedTypeMatch[is](value);
      else if(typeof SeeIf[is] === 'function')
        return SeeIf[is](value);

      return false;
    },

    type_list: function(value){
      let rtn_true = {}, rtn_false = {}, result;
      for(let seeif_name in SeeIf){
        result = SeeIf[seeif_name](value);
        if(result){
          rtn_true[seeif_name] = result;
        }
        else rtn_false[seeif_name] = result;
      }
      //Doh.log(value,'is the following types:\n',rtn);
      return {is:rtn_true, not:rtn_false};
    },
    // AA: Explain the whole logging idea here
    /**
     *  @brief Log a message to Doh (usually the console, but maybe a remote logger)
     *  
     *  @param [in] args          [array] captured args from a main logging function
     *  @param [in] log_type      [string] a string appended to the front of the log
     *  @param [in] logger_method [string] a string name of the method to use on the logger
     *  @param [in] logger        [object] the actual logger to run these commands on
     *  @return nothing
     *  
     *  @details this is usually called by a main logging function below
     */
    _log: function(args, log_type, logger_method, logger){
      log_type = log_type || '';
      logger_method = logger_method || 'log';
      //if(logger_method === 'log') logger_method = 'trace';
      logger = logger || console;
      var logger_args = [log_type];
      for(var i in args){
        if(i === 'length') continue;
        if(Doh.DebugMode){
          if(args[i]){
            if(args[i].__original__){
              // debug makes things into a proxy, help adjust for that
              args[i] = args[i].__original__;
            }
          }
        }
        logger_args.push(args[i]);
      }
      if(logger_method === 'trace'){
        logger.groupCollapsed(...logger_args);
        logger.trace();
        logger.groupEnd();
      } else {
        logger[logger_method](...logger_args);
      }
    },

    /**
     *  @brief Log a message to Doh, defaults to 'trace' type log
     *  
     *  @param [in] ...arguments [any] values to send to the logger
     *  
     *  @return nothing
     *  
     *  @details Creates a collapsed stack trace for each log entry
     *  Doh.log('error message', object1, 'some string', objectN, ...);
     */
    log: function(){
      Doh._log(arguments, 'Doh:', 'trace');
    },

    /**
     *  @brief log a custom warning to Doh
     *
     *  @param [in] context, context, ...   object(s) of relevence to the warning
     *  @return nothing
     *
     *  @details
     *  Doh.warn('error message', object1, 'some string', objectN, ...);
     */
    warn: function(){
      Doh._log(arguments, 'Doh Warning:', 'warn');
    },

    /**
     *  @brief log a custom error to Doh
     *
     *  @param [in] context, context, ...   object(s) of relevence to the error
     *  @return nothing
     *
     *  @details
     *  Doh.error('error message', object1, 'some string', objectN, ...);
     */
    error: function(){
      Doh._log(arguments, 'Doh ERROR:', 'error');
    },

    /**
     *  @brief log a debug error to Doh
     *
     *  @param [in] context, context, ...   object(s) of relevence to the error
     *  @return nothing
     *
     *  @details A debug error throws automatically in DebugMode, but otherwise does not.
     *           Used by core features that want to degrade more gracefully in production.
     *  
     *  Doh.debug('error message', object1, 'some string', objectN, ...);
     */
    debug: function(){
      if(Doh.DebugMode) throw Doh._log(arguments, 'Doh DEBUG:', 'error');
      Doh._log(arguments, 'Doh DEBUG:', 'error');
    },

    /**
     *  @brief throw and log a debug error to Doh
     *
     *  @param [in] context, context, ...   object(s) of relevence to the error
     *  @return nothing
     *
     *  @details 
     *  
     *  Doh.throw('error message', object1, 'some string', objectN, ...);
     */
    throw: function(){
      throw Doh._log(arguments, 'Doh THROW:', 'error');
    },

    /**
     *  @brief return true if item is in array
     *  
     *  @param [in] item  [any] thing to search for
     *  @param [in] array [array] to search
     *  @return true if item is in array
     *  
     *  @details Used by Doh.array_unique to filter arrays of duplicates
     *           NOTE: array_unique is required by meld_arrays
     */
    in_array: function( item, array ) {
      
      if ( typeof array == 'undefined') return -1;
      
      if ( array.indexOf ) {
        return array.indexOf( item );
      }

      for ( var i = 0, length = array.length; i < length; i++ ) {
        if ( array[ i ] === item ) {
          return i;
        }
      }

      return -1;
    },
    
    /**
     *  @brief meld all the ways we can format a list of args into a set of object keys
     *            NOTE: always melds into a new {}. No argument is altered.
     *                   maybe that should be called collect_into_objectobject?
     *
     *  @param [in] aruguments  String, Array, Array-like-object, or Object to
     *                          meld with. (See details)
     *  @return objectobject with keys from the strings and arrays and keys of arguments
     *  
     *  @details
     *  'pattern_name_1'
     *  ['pattern_name_1', 'pattern_name_2']
     *  {0:'pattern_name_1', 1:'pattern_name_2'}
     *  {'pattern_name_1':true, 'pattern_name_2':true}
     *  
     *  *RESULTS IN:* {'pattern_name_1':true, 'pattern_name_2':true}
     *  *OR* {}
     **/
    meld_into_objectobject: function(){
      // we always need a new object
      let object = {}, list, item;
      for(let arg in arguments){
        // walk through all arguments
        list = arguments[arg];
        // allow value to be a string
        if (typeof list === 'string')
          //NOTE: we can expand this to accept limited depth and complexity
          //      like, CSV or dot-notated (this.that.theother)
          object[list] = true;
        // or an object (array and object, technically)
        else if (SeeIf.IsEnumerable(list)){
          item = '';
          for(item in list){
            if (item !== 'length'){
              // allow the array structure to have the list in key (Key is not a number)
              //NOTE .is key safe?
              if(isNaN(item)) object[item] = list[item];
              // or in the list
              else object[list[item]] = true;
            }
          }
        }
      }
      // send what we found, even if empty
      return object;
    },

    /**
     *  @brief Concatenate array onto destination, removing duplicates from array.
     *  
     *  @param [in] destination [array] to be melded onto
     *  @param [in] array       [array] to meld onto destination
     *  @param [in] force_new   [bool] if true, meld both destination AND array onto a new [] and pass that back instead
     *  @return destination or the new array from being force_new'd
     *  
     *  @details Primarilly used by html for ordering classes.
     *           Used to be used by the core to manage meld_ system until being replaced by .melded.
     */
    meld_arrays: function(destination, array = [], force_new){
      if(force_new){
        Doh.debug('Someone called meld_arrays and wants it forced to new array');
        return Doh.meld_into_array(destination, array);
      }
      
      destination = destination || [];
      // loop over array
      for(var i=0; i<array.length; i++){
        // if the value is not in destination
        if(Doh.in_array(array[i], destination) == -1){
          // add it
          destination.push(array[i]);
        }
      }
      return destination;
    },
    
    /**
     *  @brief similar to meld_arrays but always melds onto a fresh array.
     *  
     *  @param [in] ...arguments arrays or values that will be flattened into a new array
     *  @return new melded array
     *  
     *  @details specifically differs from regular meld_arrays because it doesn't modify either argument
     */
    meld_into_array: function(){
      /*
      // Set is unique by default, it is also order-of-insertion.
      // arguments isn't a real array, it's a gimped one with no methods, so we have to use Array.prototype to get .flat()
      // flat() takes an array of arrays or values and flattens into a single array of all the values in each nest.
      // ... spread operator on a Set will spread it into an array or object (the outer array brackets, in our case)
      // Soooo... flatten all the arguments into a single array, then use Set to make it unique, starting with order-inserted
      //   then spread all remaining values into a new array.
      */
      return [...new Set(Array.prototype.flat.apply(arguments))];
    },

    /**
     *  @brief Given an object and method name, return an array of function references
     *         for inherited patterns that implement the named method
     *  
     *  @param [in] object      [object] to search .inherited
     *  @param [in] method_name [string] name of method to search for
     *  @return an array of function references from .inherited in order of .inherits when extended
     *  
     *  @details NOTE: also prepares and prepends the list of pre_{method} functions
     */
    find_meld_method_stack: function(object, method_name){
      let meld_method_order = [], pre_meld_method_order = [], ilist = object.inherited;
      for(let i in ilist){
        if(object.inherited[i]['pre_'+method_name]) pre_meld_method_order.push(object.inherited[i]['pre_'+method_name]);
        if(object.inherited[i][method_name]) meld_method_order.push(object.inherited[i][method_name]);
      }
      return pre_meld_method_order.concat(meld_method_order);
    },
    
    /**
     *  @brief return a closure for object[method_name] that will call each function in method_stack
     *  
     *  @param [in] object       [any] thing to use as 'this'
     *  @param [in] method_stack [array] of functions to run as this method
     *  @return a closure function that will call each function in method_stack
     *  
     *  @details object[method_name].update_meld_stack() will automatically recalculate
     *           melds based on current .inherited
     */
    meld_method: function(object, method_stack){
      // if the stack is a string, then we are trying to meld a method from object.inherited
      let method_name = false;
      if(typeof method_stack === 'string'){
        method_name = method_stack;
        method_stack = Doh.find_meld_method_stack(object, method_name);
      }
      let melded_method = function(){
        // this melder always does the same thing:
        //  walk the method stack and apply each method to the bound object
        let len = method_stack.length;
        for(let i=0;i<len;i++){
          method_stack[i].apply(object, arguments);
        }
        return object;
      };
      // track the meld_stack so we can manipulate it
      melded_method.meld_stack = method_stack;
      // if we want to update the pointer, we need a closure to access the original scope
      melded_method.update_meld_stack = function(newStack){
        // if we didn't pass a stack in but we remember our own name
        if(!newStack && method_name){
          // get the stack from Doh
          method_stack = Doh.find_meld_method_stack(object, method_name);
          return;
        }
        // otherwise, apply the stack we sent in
        method_stack = newStack;
      };
      return melded_method;
    },
    
    /**
     *  @brief Update meld_methods and phases of object
     *  
     *  @param [in] object [object] to look for melded methods on
     *  @return nothing
     *  
     *  @details operates on object, replaces melded method keys with actual method melders
     */
    update_meld_methods: function(object){
      for(let melded_prop in object.melded){
        // look for melded methods and phases on object
        if(object.melded[melded_prop] === 'method' || object.melded[melded_prop] === 'phase'){
          // conditionally update only the method stack if the method was melded before
          if(typeof object[melded_prop] === 'function')if(typeof object[melded_prop].update_meld_stack === 'function'){
            object[melded_prop].update_meld_stack();
            continue;
          }
          // otherwise, do a fresh meld
          object[melded_prop] = Doh.meld_method(object, melded_prop);
        }
      }
    },

    /*

                               ,,        ,,     ,,        ,,                           
                             `7MM      `7MM     db      `7MM                           
                               MM        MM               MM                           
    `7MMpMMMb.pMMMb.  .gP"Ya   MM   ,M""bMM   `7MM   ,M""bMM  .gP"Ya   ,6"Yb.  ,pP"Ybd 
      MM    MM    MM ,M'   Yb  MM ,AP    MM     MM ,AP    MM ,M'   Yb 8)   MM  8I   `" 
      MM    MM    MM 8M""""""  MM 8MI    MM     MM 8MI    MM 8M""""""  ,pm9MM  `YMMMa. 
      MM    MM    MM YM.    ,  MM `Mb    MM     MM `Mb    MM YM.    , 8M   MM  L.   I8 
    .JMML  JMML  JMML.`Mbmmd'.JMML.`Wbmd"MML. .JMML.`Wbmd"MML.`Mbmmd' `Moo9^Yo.M9mmmP' 


  */        
    
    // AA: clearly another essay is needed here  
    /**
     *  @brief Use Doh's meld_ functions to meld two ideas together.
     *  
     *  @param [in] destination [object] to meld into
     *  @param [in] idea        [object] to meld from
     *  @param [in] deep_melded [object] should be falsey or an object that describes melded types of properties of each idea
     *                                    - used primarily to allow deeply melded objects without polluting them with .melded
     *  @return destination
     *  
     *  @details Uses destination.melded and idea.melded (or deep_melded) to define meld and data types for each property.
     */
    meld_ideas:function(destination = {}, idea, deep_melded) {
      let prop_name = '', inner_melded = idea.melded, go_deep, melded_type, idea_prop, idea_melded_type, destination_melded_type;
      
      if(deep_melded) inner_melded = deep_melded
      
      //test melded stuff and make sure it is what we expect
      if(inner_melded){
        // we only want to know if the destination is going to be overwritten by the idea
        for(prop_name in inner_melded){
          idea_melded_type = inner_melded[prop_name];
          if(SeeIf.IsSet(idea_melded_type))if(SeeIf.NotString(idea_melded_type)) idea_melded_type = 'object';
          idea_prop = idea[prop_name];
          if(destination.melded){
            // deal with destination defines a meld type that is different from idea
            if(destination.melded[prop_name]){
              if(destination.melded[prop_name] != idea_melded_type){
                Doh.debug('Doh.meld_ideas(',destination,',',idea,'). destination.melded[',prop_name,']:',destination.melded[prop_name],'will be overwritten by idea.melded[',prop_name,']:',idea_melded_type);
              }
              if(idea_melded_type === 'exclusive' || idea_melded_type === 'static_reference'){
                // if we made it here then the check above has ensured we agree on the melded type.
                // However!! destination already reserved it, this is an error.
                Doh.debug('Doh.meld_ideas(',destination,',',idea,') found that a destination and idea both want the same property:',prop_name,'to be ',idea_melded_type,'.');
              }
            }
          }
          // deal with destination already has a property of type that is incompatible with idea.melded type
          if(SeeIf.IsDefined(destination[prop_name])){
            if(!Doh.type_match(destination[prop_name], idea_melded_type)){
              Doh.debug('Doh.meld_ideas(',destination,',',idea,'). destination[',prop_name,']:',destination[prop_name],'is an incompatible type with idea.melded[',prop_name,']:',idea_melded_type);
            }
          }
          // deal with idea has a property of type that is incompatible with idea.melded type
          if(SeeIf.IsDefined(idea_prop)){
            if(!Doh.type_match(idea_prop, idea_melded_type)){
              Doh.debug('Doh.meld_ideas(',destination,',',idea,'). idea[',prop_name,']:',idea_prop,'is an incompatible type with idea.melded[',prop_name,']:',idea_melded_type);
            }
          }
        }
      }
      prop_name = '';
      for(prop_name in destination.melded){
        destination_melded_type = destination.melded[prop_name];
        if(SeeIf.IsSet(destination_melded_type))if(SeeIf.NotString(destination_melded_type)) destination_melded_type = 'object';
        idea_prop = idea[prop_name];
        // deal with idea has a property of type that is incompatible with destination melded type
        if(SeeIf.IsDefined(idea_prop))if(destination_melded_type)if(!Doh.type_match(idea_prop, destination_melded_type)){
          Doh.debug('Doh.meld_ideas(',destination,',',idea,'). idea[',prop_name,']:',idea_prop,'is an incompatible type with destination.melded[',prop_name,']:',destination_melded_type);
        }
      }
      
      // build name-keyed objects of the melded value lists
      let parsed = {};
      if(inner_melded) parsed = JSON.parse(JSON.stringify(inner_melded));
      let melded = Doh.meld_objects(destination.melded || {}, parsed);
      // loop over the idea and decide what to do with the properties
      prop_name = '';
      for(prop_name in idea){
        melded_type = melded[prop_name];
        if(SeeIf.IsSet(melded_type))if(SeeIf.NotString(melded_type)){
          go_deep = true;
          melded_type = 'object';
        } else go_deep = false;
        idea_prop = idea[prop_name];
        if(idea_prop !== undefined && idea_prop !== destination[prop_name]){
          if(melded_type === 'method' || melded_type === 'phase' || melded_type === 'exclusive' || melded_type === 'static_reference'){
            // melded methods and phases will be updated outside of meld. our job is just to copy idea onto destination.
            // exclusive properties only come from first idea that claims it, this 'ownership' is resolved with thrown errors above, so we always copy.
            destination[prop_name] = idea_prop;
            continue;
          }
          if(melded_type === 'object' || (typeof idea_prop == 'object' && !Array.isArray(idea_prop) && SeeIf.IsEmptyObject(idea_prop))){
            // it's a melded object or an empty default
            if(deep_melded || go_deep) {
              destination[prop_name] = destination[prop_name] || {};
              destination[prop_name] = Doh.meld_ideas(destination[prop_name], idea_prop, melded[prop_name]);
            } else {
              destination[prop_name] = Doh.meld_objects(destination[prop_name] || {}, idea_prop);
            }
            continue;
          }
          if(melded_type === 'array' || (Array.isArray(idea_prop) && !idea_prop.length)){
            // it's a melded array or an empty default
            destination[prop_name] = Doh.meld_arrays(destination[prop_name], idea_prop);
            continue;
          }
          // stack the ifs for speed
          if(idea_prop.pattern)if(!idea_prop.machine)if(!idea_prop.skip_auto_build){
            // it's an auto-build property, auto-meld it below
            destination.melded[prop_name] = melded[prop_name] = 'idea';
          }
          if(melded_type === 'idea'){
            destination[prop_name] = destination[prop_name] || {};
            destination[prop_name] = Doh.meld_ideas(destination[prop_name], idea_prop);
            continue;
          }
          
          // non-melded property
          destination[prop_name] = idea_prop;
        }
      }

      return destination;
    },

    /**
     *  @brief Meld ideas with a special melded descriptor AND multiple ideas
     *  
     *  @param [in] special_melded [object] should be falsey or an object that describes melded types of properties of each idea
     *  @param [in] destination [object/falsey] an object to modify, or falsey/{} to create a new object and return it
     *  @param [in] arguments[] [idea(s)] to meld onto the destination, using special_melded as a melded_type map
     *  @return destination
     *  
     *  @details deep_meld_ideas(special_melded, dest, idea1, idea2, idea3, ...)
     */
    deep_meld_ideas: function(special_melded, destination){
      for(let i in arguments){
        if(i == 0 || i === 'length' || arguments[i] === destination) continue;
        Doh.meld_ideas(destination, arguments[i], special_melded);
      }
      return destination;
    },
    
    /*

                                                                                  
                                                              ,,                  
                    mm     mm                                 db                  
                    MM     MM                                                     
`7MMpdMAo.  ,6"Yb.mmMMmm mmMMmm .gP"Ya `7Mb,od8 `7MMpMMMb.  `7MM  M"""MMV .gP"Ya  
  MM   `Wb 8)   MM  MM     MM  ,M'   Yb  MM' "'   MM    MM    MM  '  AMV ,M'   Yb 
  MM    M8  ,pm9MM  MM     MM  8M""""""  MM       MM    MM    MM    AMV  8M"""""" 
  MM   ,AP 8M   MM  MM     MM  YM.    ,  MM       MM    MM    MM   AMV  ,YM.    , 
  MMbmmd'  `Moo9^Yo.`Mbmo  `Mbmo`Mbmmd'.JMML.   .JMML  JMML..JMML.AMMmmmM `Mbmmd' 
  MM                                                                              
.JMML.                                                                           
                                                                               
    */
    /**
     *  @brief Create a pattern for use in object construction
     *
     *  @param [in] name     a string pattern name
     *  @param [in] inherits a string or array of patterns to inherit from, in order
     *  @param [in] idea     a prototype object
     *  @return the created pattern
     *
     *  @details Additionally sets the value of this.pattern to 'name'.
     *  Can be called as follows:
     *   Pattern(idea);                  *[object] requires the idea to define .pattern
     *   Pattern(name);                  *[string] creates an empty 'object' pattern at Patterns[name]
     *   Pattern(name, idea);            *[string], [object] inherits must be in the idea if needed
     *   Pattern(name, inherits, idea);  *[string], [string/array], [object]
     */
    pattern: function(name, inherits, idea){
      // find the arguments
      if(SeeIf.NotString(name)){
        // the name is the idea
        // only allow this if the idea contains its own pattern name
        idea = name;
        if(SeeIf.IsString(idea.pattern)) name = idea.pattern;
        else Doh.debug('Doh.pattern('+idea+') tried to make a pattern with no name');

        // inherits will be in the idea.inherits
        inherits = false;
      } else if (SeeIf.NotString(inherits) && SeeIf.NotArray(inherits)) {
        // inherits is the idea
        idea = inherits;
        // inherits will be in the idea
        inherits = false;
      }
      if(!idea) idea = {};
      // otherwise the arguments are as indicated
      
      if(Doh.ApplyFixes){
        if(Doh.WatchedPatternNames[name]){
          idea.pattern = name = Doh.look_at_pattern_name(name);
        }
        else idea.pattern = name
      } else {
        // every pattern must know it's own key on the Patterns object
        idea.pattern = name;
      }
      
      if(Patterns[name]){
        // allow the new PatternModuleVictors system to dictate which pattern gets to stay and which gets overwritten
        if(PatternModuleVictors[name] && (PatternModuleVictors[name] !== Doh.ModuleCurrentlyRunning)){
          Doh.warn('(',name,') pattern was going to be overwritten but was ignored.\nOriginal Module:',Doh.PatternModule[name],'\nNew Module:',Doh.ModuleCurrentlyRunning);
          return false;
        }
        // otherwise just warn about a pattern being replaced
        Doh.warn('(',name,') pattern is being overwritten.\nOriginal Module:',Doh.PatternModule[name],'\nNew Module:',Doh.ModuleCurrentlyRunning);
      }
      // ApplyFixes tells us to look at pattern creation
      if(Doh.ApplyFixes){
        // just generates a bunch of warns and stuff with a few possible fixes. Should not be used in production.
        Doh.look_at_pattern_keys(idea);
      }

      // clean up the various ways that inherits may be passed
      idea.inherits = Doh.meld_into_objectobject(idea.inherits, inherits);
      
      // if there still aren't any inherits, at least inherit object
      if(name !== 'object')if(SeeIf.IsEmptyObject(idea.inherits)) idea.inherits.object = true;
      
      // now that we've normalized all the inherits, report our dependencies to each PatternInheritedBy
      for(var ancestor in idea.inherits){
        Doh.PatternInheritedBy[ancestor] = Doh.PatternInheritedBy[ancestor] || [];
        Doh.PatternInheritedBy[ancestor].push(name);
      }
      // we need to default the .melded collection here.
      // this allows a shorthand declaration of melded types that demand defaults
      // Pattern('mypattern',{melded:{myprop:'object'}}) will produce a pattern with pattern.myprop = {}
      // only Doh.MeldedTypeDefault[meld_type_name] will be defaulted
      let meld_type_name, meld_type_js;
      for(var prop_name in idea.melded){
        meld_type_name = idea.melded[prop_name];
        if(SeeIf.IsSet(meld_type_name))if(SeeIf.NotString(meld_type_name)) meld_type_name = 'object';
        // find out if there is a type mismatch between what .melded thinks the property SHOULD be and what IT IS.
        if(SeeIf.IsDefined(idea[prop_name]))if(!Doh.type_match(idea[prop_name], meld_type_name)){
          Doh.debug('Doh.patterns(',idea.pattern,').',prop_name,' was defined as a melded',meld_type_name,' but is not a',meld_type_name,'.',idea[prop_name],idea);
        }
        // find out if we have defined a default for this melded type
        if(Doh.MeldedTypeDefault[meld_type_name]) meld_type_js = Doh.MeldedTypeDefault[meld_type_name];
        // otherwise, find out if the melded type is unknown
        else if(!Doh.MeldedTypeMatch[meld_type_name] && !SeeIf[meld_type_name]) {
          Doh.debug('Doh.pattern(',idea.pattern,') tried to define unknown meld type:',meld_type_name,'for idea:',idea);
        }
        // default the property if needed.
        if(meld_type_js){
          // somewhat obviously, only default it if it isn't already present
          idea[prop_name] = idea[prop_name] || meld_type_js;
        }
      }
      
      // store the new pattern for the builder
      Patterns[name] = idea;
      // note the new pattern's load module, if present
      if(Doh.ModuleCurrentlyRunning){
        Doh.PatternModule[name] = Doh.ModuleCurrentlyRunning;
        Doh.ModulePatterns[Doh.ModuleCurrentlyRunning] = Doh.ModulePatterns[Doh.ModuleCurrentlyRunning] || [];
        Doh.ModulePatterns[Doh.ModuleCurrentlyRunning].push(name);
      }
      // return the new pattern
      return idea;
    },
    
    // This is used by the builder to a mix a pattern into a new instance of an object
    // AA: Describe how it might be used by a developer?
    /**
     *  @brief Mix a pattern from Patterns into destination
     *  
     *  @param [in] destination [object] the object to copy onto
     *  @param [in] pattern     [string] the name of a pattern to mixin
     *  @return destination
     *  
     *  @details Will also update_meld_methods for destination if it was previously built by New()
     */
    mixin_pattern: function(destination, pattern){
      // some checking for the pattern and double-mixing
      if(Doh.ApplyFixes){
        pattern = Doh.look_at_pattern_name(pattern);
      }
      if(Patterns[pattern]){
        if(!InstanceOf(destination, pattern)){
          // check for invalid mixin
          Doh.meld_ideas(destination, Patterns[pattern]);
          // this mixin type is 
          destination.inherited[pattern] = Patterns[pattern];
          
          // this section is only run if we are mixing into an already built object
          if(destination.machine){
            // we only want to update melds if the object is already built
            // inherited is only present on instances, patterns don't have it
            // and neither do plain ideas
            Doh.update_meld_methods(destination);
          }
        }
      } else {
        Doh.debug('Doh.mixin_pattern(',destination,',',pattern,') did not find the pattern');
      }
      return destination;
    },
        
    // AA: Surely this merits a small dissertation
    /**
     *  @brief Return a collection of all ancestor dependencies
     *  
     *  @param [in] inherits  [string/array/object] a name, list of names, or object whose keys are a list of things to inherit
     *  @param [in] skip_core [bool] remove core dependencies from the list? Default to false.
     *  @return object-list where keys are inherited patterns
     *  
     *  @details core dependencies refers to modules that come from core modules and are therefore
     *           considered universally available. In some cases it may be useful to know how dependant
     *           a given pattern is on external patterns, rather than core ones.
     */
    extend_inherits: function(inherits, skip_core = false){
      var extended = {};
      if(SeeIf.NotObjectObject(inherits)) inherits = Doh.meld_into_objectobject(inherits);
      for(var pattern_name in inherits){
        
        //Doh.look_at_pattern_name(pattern_name);
        
        if(!Patterns[pattern_name]) Doh.debug('Doh.extend_inherits() did not find pattern:', pattern_name, 'in inherits list:', inherits); // CHRIS:  Andy added this error msg, is there a better way?
        if(skip_core){
          //Doh.log(Doh.PatternModule[pattern_name],'spawns',pattern_name,'from',inherits);
          if(pattern_name !== 'idea')if(Doh.PatternModule[pattern_name].indexOf('/doh_js/') == 0){
            //Doh.log('Doh.extend_inherits() is skipping core and found a core pattern:', pattern_name, 'from module:', Doh.PatternModule[pattern_name]);
            // this is a core module because the string starts with /doh_js/
            inherits[pattern_name] = null;
            delete inherits[pattern_name]
            continue;
          }
        }
        Doh.meld_objects(extended, Doh.extend_inherits(Patterns[pattern_name].inherits, skip_core));
      }
      Doh.meld_objects(extended, inherits);
      return extended;
    },
    
    // MANDATORY FOR OBJECTS TO BE SINGLETON CLASSES
    Prototype: function(){
      // create a new object as a function that can be used as a class
      // use var to keep the class from ever being 'new' again
      var DohObject = function(){};
      // instantiate our new class the first and only time it will make an object
      return new DohObject();
    },
    
    /*
                                   
       ,,                    ,,    ,,        ,,  
      *MM                    db  `7MM      `7MM  
       MM                          MM        MM  
       MM,dMMb.`7MM  `7MM  `7MM    MM   ,M""bMM  
       MM    `Mb MM    MM    MM    MM ,AP    MM  
       MM     M8 MM    MM    MM    MM 8MI    MM  
       MM.   ,M9 MM    MM    MM    MM `Mb    MM  
       P^YbmdP'  `Mbod"YML..JMML..JMML.`Wbmd"MML.
                                                 
                                                 
    */
    /**
     *  @brief Build a new Doh Object.
     *
     *  @param [in] pattern     a string or array of patterns to inherit from, in order
     *  @param [in] idea        a prototype object
     *  @param [in] phase       a string of the phase to machine to after building
     *
     *  @return the created DohObject
     *
     *  @details
     *  Can be called as follows:
     *   New(DohObject, *optional* 'phase');    *[DohObject], [string] sending an already built object through New will move it through the phases
     *                                                                 to 'phase' or 'final' if none is specified.
     *   New(idea);                             *[object] requires the idea to define .pattern, machine to 'final' phase
     *   New('somepattern', idea);              *[string/array], [object] create a DohObject from 'somepattern' then meld idea to it, machine to 'final' phase
     *   New(['pattern1', 'pattern2'], idea);                                                     (OR 'pattern1' THEN 'pattern2')
     *   New('somepattern', idea, 'somephase'); *[string/array], [object], [string] see above, BUT machine to 'somephase'
     * 
     */
    New: function(pattern, idea, phase){
      var i = '';
      if(SeeIf.IsString(pattern)){ // if the pattern is a string,
        // then everything is normal
        // make sure idea is an object
        idea = idea || {};
        // overwrite the idea's pattern?
        // if the idea already has a pattern, stuff it onto inherits before blowing it away.
        if(SeeIf.IsString(idea.pattern))if(SeeIf.HasValue(idea.pattern))if(pattern !== idea.pattern){
          // warn about needing to do this for now, since it never happens
          Doh.warn('Doh.New(',pattern,',',idea,',',phase,') was sent pattern:',pattern,'AND different idea.pattern:',idea.pattern);
          // nest the if's for speed
          // HasValue means not undefined or null or a blank string
          if(SeeIf.HasValue(idea.inherits)){
            // NotObjectObject means that we need to convert it. 
            if(SeeIf.NotObjectObject(idea.inherits)){
              // convert inherits from whatever it is to an object so we can add to it.
              idea.inherits = Doh.meld_into_objectobject(idea.inherits);
            }
          } else {
            // it wasn't set to something unusable, so use it or create it here
            idea.inherits = idea.inherits || {};
          }
          // add our thing to it
          idea.inherits[idea.pattern] = true;
        }
        // now that we have handled possible collisions, the last pattern passed in was the argument 'pattern'
        // which means it should be the declared pattern of this idea.
        // NOTE: this means that the Pattern() definition may be different than the proported original idea.
        //       We may need to note this in some other ways.
        idea.pattern = pattern;

      } else if(SeeIf.IsArray(pattern)){ // if the pattern is an array,
        // make sure idea is an object
        idea = idea || {};
        // meld_into_objectobject() the passed-in inherits (string/array/object->object)
        idea.inherits = Doh.meld_into_objectobject(idea.inherits);
        // merge pattern into idea.inherits
        i = '';
        for(i in pattern){
          if(i === 'length') continue;
          idea.inherits[pattern[i]] = true;
        }
        // make the pattern of this idea object because this is safe.
        // object inherits from nothing and is always at the bottom of the inherits stack by default
        idea.pattern = 'object';
      
      } else { // pattern is the idea
        // first, this will mean that the phase is actually in the 'idea'
        phase = idea;
        // now we can make the idea from the first argument: 'pattern'
        idea = pattern;
      }
      // ensure that the idea object is at least blank
      // idea can still be undefined if we New();
      idea = idea || {};
      // either a specified phase or final. final works because it's reserved.
      // since there is no 'final' phase, the machine will always keep advancing
      // even if you add more phases after phase-time and run machine again.
      phase = phase || 'final';
      // if the idea already has a machine, just run it to the specified or final phase
      
      if(idea.machine){
        idea.machine(phase);
        return idea;
      }

      // meld passed-in inherits
      // this should now contain all patterns defined in the many places that things can be added to objects
      if(idea.inherits) idea.inherits = Doh.meld_into_objectobject(idea.inherits);

      if(Doh.ApplyFixes)
        idea.pattern = Doh.look_at_pattern_name(idea.pattern);
      
      // the builder requires at least one pattern
      if(SeeIf.IsEmptyObject(idea.inherits)){
        if(!Patterns[idea.pattern]) {
          // we could not find at least one pattern
          // default to object
         Doh.debug('New idea had no inherits OR no pattern was found, default pattern to "object"',idea);
         
         idea.pattern = 'object';
        }
      }

      // start with a fresh object and the container for recording inheritence
      var object = Doh.Prototype();

      object.inherited = object.inherited || {};
      // now that we have all the patterns defined and passed in, get the patterns that all that stuff depend on
      // collect a list of patterns by recursively crawling the pattern .inherits
      var patterns = Doh.meld_objects(Doh.extend_inherits(Patterns[idea.pattern].inherits), Doh.extend_inherits(idea.inherits));

      // add the pattern last
      if(idea.pattern) patterns[idea.pattern] = true;
      
      // mixin each pattern
      i = '';
      for(i in patterns){
        if(!Patterns[i]){
          Doh.debug('Doh.New('+ idea.pattern + ') tried to inherit from "', i, '" but it was not found, skipping it entirely.');
        }
        Doh.mixin_pattern(object, i);
      }

      // reset the inherits property
      object.inherits = [];

      // make inherits an ordered list of inherited
      i = '';
      for(i in patterns){
        object.inherits.push(i);
      }
      
      // setup some stuff for DebugMode
      // (we need these to exist, even if we don't do debug mode)
      // do we need a proxy?
      var proxy = false, watch,
      // stash a reference to the original object we started making
      originalObject = object,
      // a way for our us to tell the outer set and get traps that we care about a key
      // keys are keys we care about, values must be true;
      setters = {}, getters = {},
      // local storage for loop iterators
      keys, watcher,
      // when we find the functions that watch an object, push to stack so the melder will pick it up
      set_stack = [], get_stack = [];
      
      // just generates a bunch of warns and stuff with a few possible fixes. Should not be used in production.
      Doh.look_at_pattern_keys(idea);
        
      // Do stuff that only happens in DebugMode
      if(Doh.DebugMode){
        /*
         * throw a generic error if a_property is being set
         * thing.watch( 'a_property' )
         *
         * throw a generic error if a_property is being retrieved
         * thing.watch( 'a_property', 'get')
         *
         * throw a generic error if a_property is being set to a number
         * thing.watch( 'a_property', 'set', SeeIf.IsNumber )
         *
         * throw a generic error if a_property is a number when retrieved
         * thing.watch( 'a_property', 'get', SeeIf.IsNumber )
         *
         * print a generic error if a_property is being set
         * if the callback is a Bool, use it to decide if we throw. true for throw, false for print only
         * thing.watch( 'a_property', 'set', SeeIf.IsNumber, false )
         *
         * call the callback provided if a_property is being set to a number
         * thing.watch( 'a_property', 'set', SeeIf.IsNumber, function(target,prop,value){} )
         *
         * call the callback provided THEN throw an error if a_property is being set to a number
         * thing.watch( 'a_property', 'set', SeeIf.IsNumber, function(target,prop,value){}, true )
         *
         * call the callback provided THEN print an error BUT DON'T THROW, if a_property is being set to a number
         * thing.watch( 'a_property', 'set', SeeIf.IsNumber, function(target,prop,value){}, false )
         *
         * call the callback provided if a_property is being set to exactly 37
         * thing.watch( 'a_property', 'set', 37,             function(target,prop,value){Doh.log('hey,',prop,'on',target,'set to:',value,';')} )
         *
         * call the callback provided if a_property is exactly 37 when retrieved
         * thing.watch( 'a_property', 'get', 37,             function(target,prop,receiver){Doh.log('hey, got',prop,'=',target[prop],'; on',target)} )
         *
         */
        /**
         *  @brief allow proxied objects to watch their own properties
         *  
         *  @param [in] prop_name       Description for prop_name
         *  @param [in] type            Description for type
         *  @param [in] value_condition Description for value_condition
         *  @param [in] callback        Description for callback
         *  @return Return description
         *  
         *  @details
         */
        watch = function(prop_name, type = 'set', value_condition = SeeIf.IsAnything, callback){
          // figure out the last variable situation
          var throw_error = false;
          if(SeeIf.IsTrue(callback)){
            throw_error = true;
          }
          // false if the value_condition is a value, otherwise IsSeeIf will be 
          //   the string name of the SeeIf property that we should check
          let IsSeeIf = false;
          if(typeof value_condition === 'function'){
            // we only want to know about functions that are the actual SeeIf properties
            for(let tester in SeeIf){
              if(value_condition === SeeIf[tester]){
                IsSeeIf = tester;
              }
            }
          }
          
          let thrower = function(target, prop, value){
            let args = ['Watch caught "',prop,'" being',type,'to:',value,(IsSeeIf?('and it '+IsSeeIf):('which matches watched value: '+value_condition)),'on:',target];
            if(throw_error) Doh.debug(...args);
            else            Doh.warn(...args);
          };
          callback = callback || thrower;
          
          let outer_callback = function(target, prop, value){
            if(prop !== prop_name) return;
            if(type === 'get') value = target[prop];
            if(IsSeeIf){
              if(value_condition(value)){
                callback(...arguments);
              }
            } else {
              if(value_condition === value){
                callback(...arguments);
              }
            }
          };
          if(type === 'set'){
            if(originalObject.__handler__){
              originalObject.__handler__.setters[prop_name] = true;
              originalObject.__handler__.melded_set.meld_stack.push(outer_callback);
            } else {
              setters[prop_name] = true;              
              return outer_callback;
            }
          } else {
            if(originalObject.__handler__){
              originalObject.__handler__.getters[prop_name] = true;
              originalObject.__handler__.melded_get.meld_stack.push(outer_callback);
            } else {
              getters[prop_name] = true;     
              return outer_callback;
            }
          }
        };
        
        // do we need to setup watches?
        for(let ancestor in object.inherited){
          // look for setters by pattern and key
          keys = Doh.WatchedKeySetters[ancestor];
          // there are keys on this pattern that need preset watchers
          if(keys){
            watcher = '';
            // go through the watchers and set them up for each key
            for(watcher in keys){
              // is the watcher just a param list for .watch?
              if(SeeIf.IsArray(keys[watcher])){
                // if so, use as intended and continue because that system handles everything
                set_stack.push(watch(...keys[watcher]));
                continue;
              }
              // otherwise, we need to make a little wrapper to look for our key
              // each watcher needs a wrapper on the set trap that only looks for it's key
              set_stack.push((function(keys, watcher, target, prop, value){
                // if we are the key, do a thing
                if(watcher === prop){
                  // the thing we need to do should be a function that is the value of the watcher
                  keys[watcher](target, prop, value);
                }
                // we bind to this function so that the originalObject, keys, and watcher can pass through the closure
              }).bind(originalObject, keys, watcher));
              // tell the setter that we are watching this key
              setters[watcher] = true;
              // tell our checks below that we want a proxy
              proxy = true;
            }
          }
          // look for getters by pattern and key
          keys = Doh.WatchedKeyGetters[ancestor];
          // there are keys on this pattern that need preset watchers
          if(keys){
            watcher = '';
            for(watcher in keys){
              // is the watcher just a param list for .watch?
              if(SeeIf.IsArray(keys[watcher])){
                // if so, use as intended and continue because that system handles everything
                set_stack.push(watch(...keys[watcher]));
                continue;
              }
              // otherwise, we need to make a little wrapper to look for our key
              // each watcher needs a wrapper on the get trap that only looks for it's key
              get_stack.push((function(keys, watcher, object, prop, receiver){
                // if we are the key, do a thing
                if(watcher === prop){
                  // the thing we need to do should be a function that is the value of the watcher
                  keys[watcher](object, prop, receiver);
                }
                // we bind to this function so that the originalObject, keys, and watcher can pass through the closure
              }).bind(originalObject, keys, watcher));
              // tell the getter that we are watching this key
              getters[watcher] = true;
              // tell our checks below that we want a proxy
              proxy = true;
            }
          }
        }
        // if already true, fine, otherwise only true if DebugMode is set to 'proxy'
        proxy = proxy || (Doh.DebugMode==='proxy'?true:false);
        if(proxy){
          // we need the proxy reference early, but late-binding the handlers should be fine
          originalObject.__handler__ = {};
          originalObject.__handler__.setters = setters;
          originalObject.__handler__.getters = getters;
          // since we are proxying, add the ability to watch new things here
          originalObject.watch = watch;
          // we replace object here so that the rest of the system will use it in their closures
          object = new Proxy(originalObject, originalObject.__handler__);
        }
      }
      
      // attach the object machine
      object.machine = function(phase){
        // allow ApplyFixes to watch the machine activate phases
        if(Doh.ApplyFixes){
          // track when we see phases so we can mute flooding the console
          Doh.SeenPhases = Doh.SeenPhases || {};
          let watched_phase, command, command_value;
          for(let watched_phase in Doh.WatchedPhases){
            if(watched_phase === phase){
              // note that we have seen a phase ever on any object
              Doh.SeenPhases[watched_phase] = Doh.SeenPhases[watched_phase] || {};
              // find out if we are watching phases
              command = '';
              command_value = '';
              for(command in Doh.WatchedPhases[watched_phase]){
                command_value = Doh.WatchedPhases[watched_phase][command];
                switch(command){
                  case 'rename':
                    // simply rename a phase, notify once per pattern
                    if(!Doh.SeenPhases[watched_phase][object.pattern]) Doh.warn('Watched Phase:',watched_phase,'has been renamed to:',command_value,object);
                    phase = command_value;
                    break;
                  case 'run':
                    // run a function if we see the phase, change phase to the return of the function, notify once per pattern
                    if(!Doh.SeenPhases[watched_phase][object.pattern]) Doh.warn('Watched Phase:',watched_phase,'will run:',command_value,object);
                    phase = command_value(object, phase);
                    break;
                  case 'log':
                  case 'warn':
                  case 'error':
                  case 'throw':
                    Doh[command]('Watched Phase:',watched_phase,'wants to',command,':',command_value,object);
                    break;
                }
              }
              // now that we've run all the commands once, we have "seen" it, so we don't need to blast the console
              /// notify once per pattern that we have encountered watched phases
              Doh.SeenPhases[watched_phase][object.pattern] = true;
            }
          }
        }
        
        // go through the phases to the one specified, or the last
        for(let phase_name in object.melded){
          if(object.melded[phase_name] === 'phase'){
            // as long as the phase hasn't been run
            if(!object.machine.completed[phase_name]){
              // update the phase we are on
              object.machine.phase = phase_name;
              // mark it as false to indicate that it's running
              object.machine.completed[phase_name] = false;
              // run the phase
              object[phase_name].apply(object);
              // mark it as run
              object.machine.completed[phase_name] = true;
            }
            // if this is the phase we are building to, then exit here
            if(phase_name == phase) return object;
          }
        }
        // always return the object. New() relies on this.
        return object;
      };
      // allow the machine to cleanly track completed phases
      // object.machine.completed['phase'] === IsUndefined if the phase hasn't been started
      //                                       IsFalse if the phase has been started and is currently running
      //                                       IsTrue if the phase has completed successfully
      object.machine.completed = {};

      // add the idea to the object
      // now that the object has a machine, the phases and meld_methods will be added
      Doh.meld_ideas(object, idea);

      // mark the idea as inherited
      object.inherited.idea = idea;
      
      // update the meld methods to include the inherited idea we just added
      Doh.update_meld_methods(object);
      
      // now we can add the handlers, since the object is finished being constructed and is ready to go through phases
      if(Doh.DebugMode){
        if(proxy){
          // use a fancy melded_method to apply our stack of setters to each set call
          originalObject.__handler__.melded_set = Doh.meld_method(originalObject, set_stack);
          // define the main set trap
          originalObject.__handler__.set = function(target, prop, value){
            // if we try and set __original__, just return target to keep us from having circular loops when looking in from the proxy
            if(prop === '__original__') return target;
            // if we have been told that there is a setter for this property
            if(target.__handler__.setters[prop]){ 
              //throw Doh.error('setter stuff:',object,target,prop,value);
              // run the melded_set. Each setter will check if this is the prop it cares about
              target.__handler__.melded_set(...arguments);
            }
            // no matter what happens, run the reflected set so that the object's behavior is unaltered.
            return Reflect.set(...arguments);
          };
          
          // use a fancy melded_method to apply our stack of setters to each set call
          originalObject.__handler__.melded_get = Doh.meld_method(originalObject, get_stack);
          // define the main get trap
          originalObject.__handler__.get = function(target, prop){
            // if we try and get __original__, just return target to keep us from having circular loops when looking in from the proxy
            if(prop === '__original__') return target;
            // if we have been told that there is a getter for this property
            if(target.__handler__.getters[prop]){ 
              //throw Doh.error('getter stuff:',object,target,prop,receiver);
              // run the melded_get. Each getter will check if this is the prop it cares about
              target.__handler__.melded_get(...arguments);
            }
            // no matter what happens, run the reflected set so that the object's behavior is unaltered.
            return Reflect.get(...arguments);
          };
        }
      }

      // run the machine to the specified phase and return the object
      return object.machine(phase);
    },

    // AA: Explain how to use / where you should set these things (maybe templates belong on OnCoreLoaded?) 
    /**
     *  
     */
    WatchedPatternNames:{
    /*'pattern_name':{
        log:'message',
        warn:'message',
        error:'message',
        throw:'message',
        run:function(idea, prop, new_value){},
        rename:'to_this',
      }*/
    },
    WatchedPhases:{
    /*'phase_name':{
        log:'message',
        warn:'message',
        error:'message',
        throw:'message',
        run:function(idea, prop, new_value){},
        rename:'to_this',
      }*/
    },
    WatchedKeys:{
    /*'key':{
        log:'message',
        warn:'message',
        error:'message',
        throw:'message',
        run:function(idea, prop, new_value){},
        rename:'to_this',
        remove:'literally anything',
      }*/
    },
    
    WatchedKeySetters:{
      /*
      'pattern1':{
        'key1':function(object, prop, value){},
        // accept a .watch argument set for this system so there is parity between the watchers
        'key2':[prop_name, type = 'set', value_condition = SeeIf.IsAnything, callback],
      },
      'pattern8':{
        'key1':function(object, prop, value){},
        'key2':function(object, prop, value){},
      },
      */
    },
    WatchedKeyGetters:{
      /*
      'pattern1':{
        'key1':function(target, prop, receiver){},
        // accept a .watch argument set for this system so there is parity between the watchers
        'key1':[prop_name, type = 'get', value_condition = SeeIf.IsAnything, callback],
      },
      'pattern4':{
        'key1':function(target, prop, receiver){},
        'key1':function(target, prop, receiver){},
      },
      */
    },
    
    /**
     *  @brief inspect and alter keys of patterns and New ideas
     *  
     *  @param [in] idea [object] to inspect for keys that need changes
     *  @return nothing
     *  
     *  @details Used by Doh.pattern and Doh.New to watch for changed or deprecated keys
     */
    look_at_pattern_keys: function(idea){
      let logger_method = 'warn', idea_prop, pattern_prop, command, command_value;
      for(pattern_prop in Doh.WatchedKeys){
        idea_prop = '';
        for(idea_prop in idea){
          if(idea_prop === pattern_prop){
            // this idea_prop is deprecated, log it and run the list of commands to try and fix it
            command = '';
            command_value = '';
            for(command in Doh.WatchedKeys[pattern_prop]){
              command_value = Doh.WatchedKeys[pattern_prop][command];
              switch(command){
                case 'log':
                case 'warn':
                case 'error':
                case 'throw':
                  Doh[command]('WatchedKeys:',pattern_prop,'wants to',command,':',command_value,idea);
                  break;
                case 'run':
                  Doh[logger_method]('WatchedKeys:',pattern_prop,'will run:',command_value,idea);
                  command_value(idea);
                  break;
                case 'rename':
                  Doh[logger_method]('WatchedKeys:',pattern_prop,'has been renamed:',command_value,idea);
                  if(idea.melded?.[pattern_prop]){
                    idea.melded[command_value] = idea.melded[pattern_prop];
                    idea.melded[pattern_prop] = null;
                    delete idea.melded[pattern_prop];
                  }
                  // make our new reference to the contents
                  idea[command_value] = idea[pattern_prop];
                  break;
                case 'remove':
                  Doh[logger_method]('WatchedKeys:',pattern_prop,'will be removed.',idea);
                  if(idea.melded?.[pattern_prop]){
                    idea.melded[command_value] = idea.melded[pattern_prop];
                    idea.melded[pattern_prop] = null;
                    delete idea.melded[pattern_prop];
                  }
                  idea[pattern_prop] = null;
                  delete idea[pattern_prop];
                  break;
              }
            }
            // we found the thing we were looking for, just bail to the next pattern_prop
            break;
          }
        }
      }
      return idea;
    },

    look_at_pattern_name: function(pattern_name){
      //return pattern_name;
      let rtn = pattern_name, logger_method = 'warn', watched_pattern_name, command, command_value;
      
      for(watched_pattern_name in Doh.WatchedPatternNames){
        if(pattern_name === watched_pattern_name){
          // this pattern_name is watched, log it and run the list of commands to try and fix it
          command = '';
          command_value = '';
          for(command in Doh.WatchedPatternNames[pattern_name]){
            command_value = Doh.WatchedPatternNames[pattern_name][command];
            switch(command){
              case 'log':
              case 'warn':
              case 'error':
              case 'throw':
                Doh[command]('WatchedPatternNames:',pattern_name,'wants to',command,':',command_value);
                break;
              case 'run':
                Doh[logger_method]('WatchedPatternNames:',pattern_name,'will run:',command_value);
                rtn = command_value(pattern_or_name, pattern_name, pattern);
                break;
              case 'rename':
                Doh[logger_method]('WatchedPatternNames:',pattern_name,'has been renamed:',command_value);
                // make our new reference to the contents
                rtn = command_value;
                break;
            }
          }
          // we found the thing we were looking for, just bail to the next pattern_name
          break;
        }
      }
      return rtn;
      //*/
    },
    
    observe: function(object, prop, on_change_callback){
      let prop_desc;
      if(SeeIf.IsObjectObject(object)){
        if(SeeIf.IsString(prop)){
          prop_desc = Object.getOwnPropertyDescriptor(object, prop);
          if(SeeIf.NotFunction(prop_desc.set)){
            let val = object[prop];
            let method_stack = [];
            let melded_method = function(new_value){
              if(val !== new_value){
                // set the value to the new value
                // we have to set the val first BEFORE calling the stack or we will recurse on ourself forever
                val = new_value;
                // this melder always does the same thing:
                //  walk the method stack and apply each method to the bound object
                let len = method_stack.length;
                for(let i=0;i<len;i++){
                  method_stack[i](new_value, prop, object);
                }
              }
            };
            // track the meld_stack so we can manipulate it
            melded_method.meld_stack = method_stack;
            // if we want to update the pointer, we need a closure to access the original scope
            melded_method.update_meld_stack = function(new_stack){
              // if we didn't pass a stack
              if(!new_stack){
                Doh.debug("[melded_method].update_meld_stack didn't get a new_stack");
                return;
              }
              // otherwise, apply the stack we sent in
              method_stack = new_stack;
            };
            // attach a utility method to remove melded functions from the stack
            melded_method.remove_melded = function(method){
              method_stack.splice(method_stack.indexOf(method), 1);
            };
            
            Object.defineProperty(object, prop, {
              get: function(){return val;},
              set: melded_method,
              enumerable: SeeIf.IsEnumerable(val),
              configurable: true,
            });
          }
          // we have to get (or re-get) the prop_desc here in case the melded setter already exists
          prop_desc = Object.getOwnPropertyDescriptor(object, prop);
          prop_desc.set.meld_stack.push(on_change_callback);
          return function(){
            prop_desc.set.remove_melded(on_change_callback);
          }
        }
      }
    },
    // tell two things to have their defined prop mimic the other
    // optionally provide a callback to be run when either side changes their mimicked prop
    mimic: function(my_thing, my_prop, their_thing, their_prop, on_change_callback){
      
      // syncing demands initial state to be synced BEFORE setters are defined
      // this keeps the initial set from echoing forever
      if(my_thing[my_prop] !== their_thing[their_prop]) my_thing[my_prop] = their_thing[their_prop];
      
      let my_set = function(new_value, prop, object){
        // i only get run if my value changed
        their_thing[their_prop] = new_value;
        if(on_change_callback) on_change_callback(my_thing, my_prop, their_thing, their_prop, new_value);
      },
      their_set = function(new_value){
        // i get run if THEIR value changed, we still have to check
        // if the new value is actually new to us too.
        if(new_value !== my_thing[my_prop]){
          // if it IS new to us, then setting it will trigger the setters
          my_thing[my_prop] = new_value;
        }
      },
      my_remover = Doh.observe(my_thing, my_prop, my_set),
      their_remover = Doh.observe(their_thing, their_prop, their_set);
      // return a function that can be called to remove both callbacks
      return function(){
        my_remover();
        their_remover();
      };
    },
    
    // AA:  can we develop a system for readability / discovery.   maybe things like this (that return info) should be named "get_meld_method_order" or "meld_method_order_to_array"
    /**
     *  @brief Shallow-meld multiple objects (arguments) into destination
     *  
     *  @param [in] object Description for object
     *  @param [in] method Description for method
     *  @return Return description
     *  
     *  @details 
     */
    get_melded_method_order: function(object, method){
      var meld_method_order = [], pre_meld_method_order = [];
      for(var i in object.inherited){
        if(object.inherited[i]['pre_'+method]) pre_meld_method_order.push(i+'.pre_'+method);
        if(object.inherited[i][method]) meld_method_order.push(i+'.'+method);
      }
      return pre_meld_method_order.concat(meld_method_order);
    },
    
    /**
     *  @brief Shallow-meld multiple objects (arguments) into destination
     *  
     *  @param [in] object Description for object
     *  @return Return description
     *  
     *  @details 
     */
    get_phase_method_order: function(object){
      var phases_method_order = [];
      for(var melded_prop in object.melded){
        if(object.melded[melded_prop] === 'phase'){
          phases_method_order.push(Doh.get_melded_method_order(object, melded_prop));
        }
      }
      return phases_method_order;
    },
        
    /**
     *  @brief Shallow-meld multiple objects (arguments) into destination
     *  
     *  @param [in] object Description for object
     *  @return Return description
     *  
     *  @details 
     */
    get_all_melded_method_order: function(object){
      var methods_order = [], counter = 0, phase_methods = 0;
      
      for(var melded_prop in object.melded){
        if(object.melded[melded_prop] === 'method' || object.melded[melded_prop] === 'phase'){
          methods_order.push(Doh.get_melded_method_order(object, melded_prop));
          counter += methods_order[methods_order.length-1].length
        }
      }
      /*
      for(let i in object.phases){
        methods_order.push(Doh.get_melded_method_order(object, object.phases[i]));
        counter += methods_order[methods_order.length-1].length
      }
      phase_methods = counter;
      Doh.log('has:', phase_methods, ' phase methods.');
      for(let i in object.meld_methods){
        methods_order.push(Doh.get_melded_method_order(object, object.meld_methods[i]));
        counter += methods_order[methods_order.length-1].length
      }
      Doh.log('and:', counter - phase_methods, ' melded methods.');
      */
      return methods_order;
    },
    
    // send the stringified code of a melded method to the Doh log
    /**
     *  @brief Shallow-meld multiple objects (arguments) into destination
     *  
     *  @param [in] object Description for object
     *  @param [in] method Description for method
     *  @return Return description
     *  
     *  @details 
     */
    log_melded_method_string: function(object, method){
      var method_array = Doh.get_melded_method_order(object, method);
      for (i in method_array){
        Doh.log(method_array[i],object.inherited[method_array[i].split('.')[0]][method].toString());
      }
    },
    
    // send a clickable list of the melded methods to the Doh log
    /**
     *  @brief Shallow-meld multiple objects (arguments) into destination
     *  
     *  @param [in] object Description for object
     *  @param [in] method Description for method
     *  @return Return description
     *  
     *  @details 
     */
    log_melded_method_source: function(object, method){
      var method_array = Doh.get_melded_method_order(object, method);
      for (i in method_array){
        Doh.log(method_array[i],object.inherited[method_array[i].split('.')[0]][method]);
      }
    }
    
  });
  /* **** Doh Object Ready **** */
  Patterns = Doh.Patterns;
  Pattern = Doh.pattern;
  New = Doh.New;
  /**
   *  @brief determine if an object has had a pattern mixed into it
   *  
   *  @param [in] object    [object] to search pattern inheritence
   *  @param [in] pattern   [string] name of pattern to search for
   *  @return true if object inherited pattern, otherwise false
   *  
   *  @details 

   */
  InstanceOf = Doh.InstanceOf = function(object, pattern){
    pattern = pattern || 'object';
    if(object)if(object.inherited)if(object.inherited[pattern]) return true;
    return false;
  }

  // AA: It might be worth crafting a small ode to the elegance of this
  /**
   *  
   *  NOTE: DO NOT INHERIT THIS PATTERN
   */
  Pattern('idea');
  
  // set the prototype for the object constructor
  /**
   *  
   */
  Pattern('object', {
    // define the melded types of all objects of Doh
    melded:{
      // always meld this collection so our patterns can extend this
      melded:'object',
      // mark object_phase as a phase
      object_phase:'phase',
      // mark idealize and perspective as exclusive
      // this will indicate that we want the builder to ignore anyone setting it except us
      idealize:'exclusive',
      perspective:'exclusive',
    },
    // ensure that we are the base object phase
    object_phase: function() {
      // find any properties that are ideas
      for(var prop_name in this) {
        if(prop_name === 'prototype' || prop_name === '__proto__') continue; // sometimes these pop up. iterating 'this' is dangerous for some reason
        // nest the if's for speed
        // it has to exist, have .pattern, not have .machine and not have .skip_auto_build.
        // check existance, check for pattern, check for if we have been built already, check for wanting to be ignored
        if(this[prop_name])if(this[prop_name].pattern)if(this[prop_name].pattern !== 'idea')if(!this[prop_name].machine)if(!this[prop_name].skip_auto_build){
          // only things that have auto_built should have this
          this.auto_built = this.auto_built || {};
          // tell the thing that we are auto building it. this allows the thing to react to being auto_built if needed
          this[prop_name]._auto_built_by = this;
          // tell the thing how to reference itself from it's auto-built parent (thing._auto_built_by[thing._auto_built_by_name] = thing)
          this[prop_name]._auto_built_by_name = prop_name;
          // for instance, auto_building only runs to object phase. if further or 'final' phase is desired, run .machine_properties(phase)
          this[prop_name] = New(this[prop_name], 'object_phase');
          // add our new reference to auto_built
          this.auto_built[prop_name] = this[prop_name];
        }
      }
    },
    /*                                                 
      ,,        ,,                     ,,    ,,                  
      db      `7MM                   `7MM    db                  
                MM                     MM                        
    `7MM   ,M""bMM  .gP"Ya   ,6"Yb.    MM  `7MM  M"""MMV .gP"Ya  
      MM ,AP    MM ,M'   Yb 8)   MM    MM    MM  '  AMV ,M'   Yb 
      MM 8MI    MM 8M""""""  ,pm9MM    MM    MM    AMV  8M"""""" 
      MM `Mb    MM YM.    , 8M   MM    MM    MM   AMV  ,YM.    , 
    .JMML.`Wbmd"MML.`Mbmmd' `Moo9^Yo..JMML..JMML.AMMmmmM `Mbmmd' 
                                                                 
                                                             
    */                                                                                                          
    // change param name to inherits to indicate a inherits type array
    /**
     *  @brief reduce an object to it's 'ideal' state based on a list of
     *         patterns it inherits from
     *  
     *  @param [in] inherits [string/array/object] string or list of inherits to filter for
     *  @param [in] active   [bool] default to false to get the initial values of each key for each pattern in inherits
     *  @return a new idea containing the filtered set of keys from this
     *  
     *  @details Differs from .perspective because the list of patterns MUST be in .inherited,
     *           functions will always be ignored, and values can be retrieved from the .inherited defaults or that active object
     */
    idealize: function(inherits, active) {
      let j, new_idea = {}, which_idea;
      // default to finding the original idea
      inherits = inherits || 'idea';
      // make sure that inherits is an array
      inherits = Object.keys(Doh.meld_into_objectobject(inherits));
      // for each filter idea
      for(let i=0; i<inherits.length; i++){
        which_idea = inherits[i];
        j = '';
        // loop over the idea and use it to add properties from the inherited.idea
        for(j in this.inherited[which_idea]){
          // functions should only come from the inherited.idea
          if(typeof this.inherited[which_idea][j] === 'function'){
            if(which_idea === 'idea'){
              new_idea[j] = this.inherited.idea[j];
            }
            continue;
          }
          // if we are getting active values, get them from this
          if(which_idea === 'idea' || j !== 'inherits'){
            if(active){
              new_idea[j] = this[j];
            } else if(this.inherited[which_idea][j] !== undefined) {
              
              new_idea[j] = this.inherited[which_idea][j];
            }
          }
        }
        // if the idea has a funtion for it's "ideal" state, run it
        if(Patterns[which_idea])
         if(typeof Patterns[which_idea].idealize === 'function'){
            Patterns[which_idea].idealize.call(this, inherits, active, new_idea);
        }
      }
      return new_idea;
    },
    
    /**
     *  @brief Show properties/methods/both of a doh object filtered by 
     *         an arbitrary list of patterns
     *  
     *  @param [in] patterns [string/array/object] list of patterns to filter for
     *  @param [in] methods  Description for methods
     *  @return a new idea containing the filtered set of keys from this
     *  
     *  @details Differs from .idealize because the list of patterns does not have to be from .inherited,
     *           values retrieved are always from this rather than .inherited,
     *           and methods can be optionally included, or selected exclusively
     */
    perspective: function(patterns, methods = false){
      let prop, new_idea = {}, which_idea, pattern_object, original_patterns = patterns;
      
      Doh.log('Doh.perspective() was sent patterns:',patterns,'and methods:',methods);
      // default to finding the original idea
      patterns = patterns || 'idea';
      if(patterns === 'idea'){
        pattern_object = this.inherited.idea;
        /*
         * ideas can introduce patterns for inheritance in: .inherits, New('pattern_name', ...), and New(['pattern_1', 'pattern_2'], ...)
         * this is also the order of signifigance
         * so pattern_2 will be the last pattern inherited.
         */
         patterns = Doh.meld_into_objectobject(patterns, pattern_object.inherits, pattern_object.pattern);
      }
      Doh.log('Doh.perspective() is using',patterns,'to extend inherits.');
      // default to expanding the pattern, but skip core patterns, cause we never need those
      patterns = Object.keys(Doh.extend_inherits(patterns, true));
      Doh.log('Doh.perspective() found:',patterns);
      // for each filter idea
      for(let i=0; i<patterns.length; i++){
        which_idea = patterns[i];
        if(which_idea === 'idea'){
          pattern_object = this.inherited.idea;
        } else {
          pattern_object = Patterns[which_idea];
        }
        prop = '';
        // loop over the pattern or idea and use it to add properties to new_idea
        for(prop in pattern_object){
          //if(which_idea !== 'object' /*|| i != 'html'*/){
            if(!methods){
              if(typeof this[prop] !== 'function'){
                new_idea[prop] = this[prop];
              }
            } else {
              if(methods === 'both'){
                new_idea[prop] = this[prop];
              } else if(typeof this[prop] === 'function'){
                new_idea[prop] = this[prop];
              }
            }
          //}
        }
        // if it's a pattern or the idea that has a function for it's "perspective" state, then run it
        if(pattern_object)
          if(typeof pattern_object.perspective === 'function'){
            pattern_object.perspective.call(this, patterns, methods, which_idea, pattern_object, new_idea);
          }
      }
      return new_idea;
    },

  });

// AA: group this with the log stuff above?   
  Pattern('log', 'object', {
    log_type: 'Doh:',
    logger:console,
    logger_method: 'log',
    melded:{
      log_phase:'phase'
    },
    log_phase: function(){
      var args = [this.log_type];
      for(var i in this.args){
        if(i === 'length') continue;
        args.push(this.args[i]);
      }
      this.logger[this.logger_method].apply(this.logger, args);
    }
  }); // true to skip adding css classes for this object

  Pattern('error', 'log', {
    log_type: 'Doh ERROR:',
    logger_method: 'error',
  }); // true to skip adding css classes for this object

  Pattern('warning', 'log', {
    log_type: 'Doh Warning:',
    logger_method: 'warn',
  });

/*
                                                                                                                                                                   
                                                                              
  ,,          ,,                                           ,,                 
`7MM          db                                         `7MM                 
  MM                                                       MM                 
  MMpMMMb.  `7MM  .gP"Ya `7Mb,od8 ,6"Yb.  `7Mb,od8 ,p6"bo  MMpMMMb.`7M'   `MF'
  MM    MM    MM ,M'   Yb  MM' "'8)   MM    MM' "'6M'  OO  MM    MM  VA   ,V  
  MM    MM    MM 8M""""""  MM     ,pm9MM    MM    8M       MM    MM   VA ,V   
  MM    MM    MM YM.    ,  MM    8M   MM    MM    YM.    , MM    MM    VVV    
.JMML  JMML..JMML.`Mbmmd'.JMML.  `Moo9^Yo..JMML.   YMbmd'.JMML  JMML.  ,V     
                                                                      ,V      
                                                                   OOb"                                                                                                                                                                         
*/

  // AA: talk about the relationship of this to html, the role of the children array

  Pattern('parenting', 'object', {
    // parent should be a Doh Object or false
    parent: false,
    // list of child objects to build
    children: [],
    // advance the children machine to this phase when building
    machine_children_to: 'parenting_phase',
    // extend the children array
    melded:{
      children: 'array',
      // setup our phases for building children and controls
      parenting_phase: 'phase',
    },
    // create a phase to build children
    parenting_phase: function(){
      // loop through the children and attempt to build them
      var i = '', child = false, prop_name = false;
      for(i in this.children) {
        if(i === 'length') continue;
        child = this.children[i];
        // if the child is a string then check if a property with that name is an idea that wants to be auto-built
        if(typeof child === 'string'){
          if(this.auto_built[child]){
            // if the child string points to a valid auto-built property, then suck it up here and keep it from being auto-built more
            this.auto_built[child] = null;
            delete this.auto_built[child];
            // store a copy of our property name from our parent
            //NOTE: deprecate this?
            this[child].parental_name = this[child]._auto_built_by_name;
            // make the thing we are working on the parent property that our string points to
            child = this[child];
          }
        }
        // meld ourselves as the parent for the child, unless it has a better idea
        this.children[i] = Doh.meld_objects({parent:this}, child);
      }
      if(SeeIf.NotEmptyObject(this.auto_built)){
        prop_name = '';
        for(prop_name in this.auto_built) {
          // auto build remaining property ideas at the end
          this.children.push(Doh.meld_objects({parent:this}, this.auto_built[prop_name]));
          // always remove ourself from any known system that we are replacing.
          // object only machines through object_phase, we are required to machine our own properties
          this.auto_built[prop_name] = null;
          delete this.auto_built[prop_name];
        }
      }
      this.machine_children(this.machine_children_to);
    },
    machine_children: function(phase){
      // loop through the children and attempt to machine them
      for(var i in this.children) {
        if(i === 'length') continue;
        this.children[i] = New(this.children[i], phase);
      }
    },
  });

  //fab_iterator = null;
  Pattern('fab', 'parenting', {
    // list of things to fab, key is fab_iterator
    fab: {},
    // base idea used to build each child
    fab_idea: {skip_auto_build:true},
    melded:{
      fab:'object',
      fab_idea:'object',
      fab_phase:'phase',
    },
    object_phase: function(){
      // move our phase to before parenting_phase
      // we need to populate the children ideas prior to building
      let old_melded = this.melded;
      this.melded = {};
      for(prop_name in old_melded){
        if(prop_name == 'parenting_phase') this.melded.fab_phase = 'phase';
        if(prop_name == 'fab_phase') continue;
        this.melded[prop_name] = old_melded[prop_name];
      }
      //Doh.array_move(this.phases, this.phases.indexOf('fab_phase'), this.phases.indexOf('parenting_phase'));
    },
    // create a phase to build children ideas
    fab_phase: function(){
      var fabs={}, j = '';
      // loop through the children and attempt to build them
      for(var i in this.fab) {
        if(i === 'length') continue;
        // our own iteration tracking
        fabs.fab_iterator = i;
        fabs.fab_value = this.fab[i];
        // custom iteration tracking
        for(j in this.fab_iterator_mask){
          fabs[j] = i;
        }
        j = '';
        for(j in this.fab_value_mask){
          fabs[j] = this.fab[i];
        }
        // build the ideas
        this.children.push(Doh.meld_objects({},this.fab_idea,fabs));
      }
    },
  });

}, 'glob');

/*
 * Collection of fixes that apply to core Doh modules that aren't core itself.
 * We cannot make the core work with old stuff. Instead, we upgrade the old stuff to work with the new core
 */
// fix old Doh. references that have moved
// NOTE: we aggressively comment these out as soon they are no longer needed
OnCoreLoaded(Doh.ApplyFixes, function(){
  /*
   * Fixes for changing the name of properties on Doh
   */
  var rename_wrapper = function(old_doh_prop, new_full_name, new_thing){
    if(typeof new_thing === 'function'){
      Doh[old_doh_prop] = function(){
        Doh.warn('Using old name of Doh.'+old_doh_prop+'() for new method:',new_full_name+'()');
        return new_thing(...arguments);
      }
    } else {
      Doh[old_doh_prop] = new_thing;
    }
  }
  
  // these renames are fresh, and need to be run always
  rename_wrapper('meld_method_stack', 'Doh.find_meld_method_stack', Doh.find_meld_method_stack);
  rename_wrapper('meld_method_order', 'Doh.get_melded_method_order', Doh.get_melded_method_order);
  rename_wrapper('phases_method_order', 'Doh.get_phase_method_order', Doh.get_phase_method_order);
  rename_wrapper('meld_methods_order', 'Doh.get_all_melded_method_order', Doh.get_all_melded_method_order);
  rename_wrapper('log_melded_method', 'Doh.log_melded_method_string', Doh.log_melded_method_string);
  rename_wrapper('link_melded_method', 'Doh.log_melded_method_source', Doh.log_melded_method_source);
  
  /* these renames may still plague old code, but usually are not needed
  for(var test in SeeIf){
    rename_wrapper(test, 'SeeIf.'+test, SeeIf[test]);
  }
  rename_wrapper('isEmptyObject', 'SeeIf.IsEmptyObject', SeeIf.IsEmptyObject);
  rename_wrapper('isSet', 'SeeIf.IsSet', SeeIf.IsSet);
  rename_wrapper('inArray', 'Doh.in_array', Doh.in_array);
  rename_wrapper('Warn', 'Doh.warn', Doh.warn);
  rename_wrapper('Error', 'Doh.error', Doh.error);
  rename_wrapper('ExtendInherits', 'Doh.extend_inherits', Doh.extend_inherits);
  //*/
});

// fix old melders
OnCoreLoaded(Doh.ApplyFixes, function(){
  /*
   * Fixes for changing meld_arrays, meld_objects, meld_methods, and phases to .melded
   */
  var fix_old_melders = function(old_melder, meld_type, idea){
    // fix old meld_ melders to be new .melded style
    idea.melded = idea.melded || {};
    if(idea[old_melder]){
      // if there are meld_arrays
      if(idea[old_melder].length){
        // walk the old meld_arrays
        for(let i in idea[old_melder]){
          // add them to the new melded system
          idea.melded[idea[old_melder][i]] = meld_type;
        }
      }
    }
  }
  Doh.meld_objects(Doh.WatchedKeys, {
    meld_arrays:{
      // we only get run if there is a meld_arrays key
      run:fix_old_melders.bind(window, 'meld_arrays','array'),
      remove:true
    },
    meld_objects:{
      run:fix_old_melders.bind(window, 'meld_objects','object'),
      remove:true
    },
    meld_methods:{
      run:fix_old_melders.bind(window, 'meld_methods','method'),
      remove:true
    },
    phases:{
      run:fix_old_melders.bind(window, 'phases','phase'),
      remove:true
    }
  });
});

OnLoad('/doh_js/utils', function($){
    
  Pattern('dict', 'object', {
    each: function(callback){
      let po = Patterns.object, pd = Patterns.dict_filter;
      for(let key in this){
        if(po[key] || pd[key]) continue;
        callback(key, this[key], this);
      }
    }
  });
  // the stuff that object adds, or may add, which must be removed from meach loops
  // NOTE: DO NOT INHERIT THIS PATTERN
  Pattern('dict_filter', 'object', {
    // will be added by New()
    machine:true,
    inherits:true,
    inherited:true,
    // will be added by dict
    each:true,
    // may be added by object during object_phase
    auto_built:true,
    _auto_built_by:true,
    _auto_built_by_name:true,
    // may be added by debug mode during New
    watch:true,
  });
  
  /**
   *  A place to house things that we no longer want in core, but don't yet have another home
   */
  Doh.meld_objects(Doh, {
    // AA:  Explain the role of ids
    /**
     *  @brief Get a new id
     *
     *  @return A new ephemeral id
     *  
     *  @details IDs are a simple way to get ephemeral indexes that reset on each page load
     */
    NewIdCounter:0,
    new_id: function () {
      return this.NewIdCounter += 1;
    },

    // AA: general utility?
    array_move: function(array, from_index, to_index) {
      array.splice(to_index, 0, array.splice(from_index, 1)[0]);
      return array;
    },
    /**
     *  @brief old closure melder for methods that bound them in a wrapper
     *  
     *  @param [in] object    [object/literal] to use for 'this'
     *  @param [in] method    [function] to extend
     *  @param [in] extension [function] to run after method. (could be another wrapper)
     *  @return the new function
     *  
     *  @details This is the old way that Doh used to meld methods, It is very inflexible and 
     *           it's use is unknown. The new melders are so much better in ever way that it is
     *           not known if this method has any advantages at all.
     */
    meld_methods: function(object, method, extension){
        return function(){
          method.apply(object, arguments);
          extension.apply(object, arguments);
          return object;
        }
    },
    /**
     *  @brief Turn a dot delimited name into a deep reference on 'base'
     *
     *  @param [in] base    The object to get a deep reference to
     *                      pass TRUE to 'base' and it will return the last key of the split
     *  @param [in] var_str A dot-delimited string
     *  @return A deep reference into 'base' or the last key of the split
     */
    parse_reference: function(base, var_str){
      var values = base;
      var var_arr = new String(var_str).split('.');
      // pass TRUE to 'base' and it will return the last key of the split
      if(base===true) return var_arr[var_arr.length-1];
      for(var i=0; i < var_arr.length; i++)
      values = values[var_arr[i]];

      return values;
    },

    // AA: things like this and parse_reference above are rather general utilities (not Doh-specific), I think it would be helpful to group them all, and maybe demote them
    // in fact, if they aren't used by core, they should move into something more like my sim_util global space
    
    //return items from an array that pass callback
    /**
     *  @brief return items from array that pass (callback == !inverse)
     *  
     *  @param [in] array    [array] to search
     *  @param [in] callback [function] to call for each key in array
     *  @param [in] inverse  [bool] invert the result of each callback? defaults to false
     *  @return Return description
     *  
     *  @details Old method used by array_unique for meld_arrays. No longer in use in core.
     */
    grep: function( array, callback, inverse ) {
      var ret = [];
      // Go through the array, only saving the items
      // that pass the validator function
      for ( var i = 0, length = array.length; i < length; i++ ) {
        if ( !inverse !== !callback( array[ i ], i ) ) {
          ret.push( array[ i ] );
        }
      }
      return ret;
    },
    /**
     *  @brief return an array filtered of duplicates
     *  
     *  @param [in] arr Description for arr
     *  @return Return description
     *  
     *  @details Old method used by meld_arrays. No longer in use in core.
     */
    array_unique: function(array){
      // reduce the array to contain no dupes via grep/in_array
      return Doh.grep(array,function(value,key){
          return Doh.in_array(value,array) === key;
      });
    },
    /**
     *  @brief transpose array values into the keys of a new object
     *  
     *  @param [in] array [array] to get values from
     *  @return new {} object with keys from the array values
     *  
     *  @details Very handy transposition tool, but currently unused in core
     */
    object_keys_from_array_values: function (array = []){
      var object = {};
      for(var i=0; i<array.length; i++){
        object[array[i]] = true
      }
      return object;
    },
    
    // args.exclude_methods, args.truncate_methods, args.exclude_children
    /**
     *  @brief Shallow-meld multiple objects (arguments) into destination
     *  
     *  @param [in] idea Description for idea
     *  @param [in] args Description for args
     *  @return Return description
     *  
     *  @details 
     */
    idea_to_yaml: function(idea, args){
      var ic = this.idea_to_ideacode(idea, args);
      return jsyaml.load(ic);
    },

  // AA: show how this is used, what are the args?
    /**
     *  @brief Shallow-meld multiple objects (arguments) into destination
     *  
     *  @param [in] idea Description for idea
     *  @param [in] args Description for args
     *  @return Return description
     *  
     *  @details 
     */
    idea_to_ideacode: function(idea, args){

      var trailing_comma = '';

      var str = (Array.isArray(idea)? '[':'{');

      for(var i in idea){
        if(i == 'prototype' || i == '__proto__') {continue;}
        if(idea[i] instanceof Doh.jQuery) {continue;}
        if(InstanceOf(idea[i])){ continue;}
        if(args){
          if(args.exclude_methods){if(typeof idea[i] == 'function') continue;}
          if(args.exclude_children){if(i == 'children') continue;}
        }

        str = str + trailing_comma;
        trailing_comma = ',';

        if(!Array.isArray(idea)) str = str + '"' + i + '":';

        switch(typeof idea[i]){
          case 'function':
            if(args)if(args.truncate_methods){
              str = str + 'Function';
              break;
            }
          case 'number':
          case 'boolean': // ANDY added 11.30.19
            str = str + ''+idea[i];
            break;
          case 'object':
          case 'array':
            str = str + Doh.idea_to_ideacode(idea[i]);
            break;
          case 'string':
            if(i == 'children'){
              str = str + ''+idea[i];
              break;
            }
          default:
            str = str + '"' + idea[i] + '"';
            break;
        }
      }

      str = str + (Array.isArray(idea)? ']':'}');

      return str;
    },
    /**
     *  @brief Shallow-meld multiple objects (arguments) into destination
     *  
     *  @param [in] idea   Description for idea
     *  @param [in] indent Description for indent
     *  @return Return description
     *  
     *  @details 
     */
    idea_to_pretty_ideacode: function(idea, indent){
      var args = false;
      if(typeof indent == 'object'){
        args = indent;
        indent = args.indent || 1;
      } else indent = indent || 1;
      var indent_type = '  ', indent_str = indent_type.repeat(indent);

      var trailing_comma = '';

      var str = (Array.isArray(idea)? '[\n':'{\n');

      for(var i in idea){
        if(i == 'prototype' || i == '__proto__') {continue;}
        if(idea[i] instanceof Doh.jQuery) {continue;}
        if(InstanceOf(idea[i])){ continue;}
        if(args){
          if(args.exclude_methods){if(typeof idea[i] == 'function') continue;}
          if(args.exclude_children){if(i == 'children') continue;}
        }

        str = str + trailing_comma;
        trailing_comma = ',\n';

        if(!Array.isArray(idea)) str = str + indent_str + i + ':';
        else str = str + indent_str;

        switch(typeof idea[i]){
          case 'function':
            if(args)if(args.truncate_methods){
              str = str + 'Function';
              break;
            }
          case 'number':
            str = str + ''+idea[i];
            break;
          case 'object':
          case 'array':
            str = str + Doh.idea_to_ideacode(idea[i], indent + 1);
            break;
          case 'string':
            if(i == 'children'){
              str = str + ''+idea[i];
              break;
            }
          default:
            str = str + '"' + idea[i] + '"';
            break;
        }
      }

      str = str + indent_type.repeat(indent - 1 || 0) + (Array.isArray(idea)? ']':'}');

      return str;
    },
    // AA: ?
    /**
     *  @brief Shallow-meld multiple objects (arguments) into destination
     *  
     *  @param [in] ideacode Description for ideacode
     *  @return Return description
     *  
     *  @details 
     */
    ideacode_to_source: function(ideacode){
      return 'New(' + ideacode + ');\n';
    },

  });

});

/**
 * jQuery plugin for adding, removing and making changes to CSS rules
 * 
 * @author Vimal Aravindashan
 * @version 0.3.7
 * @licensed MIT license
 */
(function (factory) {
	if (typeof module === "object" && typeof module.exports === "object") {
		// Node/CommonJS
		module.exports = factory;
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {
	var	_ahref = $(document.createElement('a')), /**< <a> tag used for evaluating hrefs */
		_styles = _ahref.prop('style'), /**< Collection of styles available on the host */
		_sheet = function(s) {
			return s.sheet || s.styleSheet;
		}($('<style type="text/css">*{}</style>').appendTo('head')[0]), /**< StyleSheet for adding new rules*/
		_rules = ('cssRules' in _sheet) ? 'cssRules' : 'rules', /**< Attribute name for rules collection in a stylesheet */
		vendorPrefixes = ["Webkit", "O", "Moz", "ms"]; /**< Case sensitive list of vendor specific prefixes */
	
	/**
	 * @function filterStyleSheet
	 * Filter a stylesheet based on accessibility and, ID or location
	 * @param {String} filter Filter to be applied. id or href of the style element can be used as filters.
	 * @param {CSSStyleSheet} styleSheet StyleSheet to be filtered
	 * @returns {Boolean} true if styleSheet matches the filter, false otherwise
	 */
	function filterStyleSheet(filter, styleSheet) {
		try {
			if(styleSheet[_rules]) {
				filter = filter || '';
				var node = $(styleSheet.ownerNode || styleSheet.owningElement);
				return (filter === '') || (filter === '*') ||
					('#'+(node.prop('id') || '') == filter) ||
					((node.prop('href') || '') == _ahref.prop('href', filter).prop('href'));
			} else {
				return false;
			}
		} catch(e) {
			return false;
		}
	}
	
	/**
	 * @function parseSelector
	 * Splits a jQuery.stylesheet compatible selector into stylesheet filter and selector text
	 * @param {String} selector Selector text to be parsed
	 * @returns {Object} object with two properties 'styleSheet' and 'selectorText'
	 */
	function parseSelector(selector) {
		var styleSheet = (/.*?{/.exec(selector) || ['{'])[0],
			selectorText = /{.*}/g.exec(selector); //TODO: replace selector with dict object
		if(selectorText === null) {
			var parts = selector.split('{');
			selectorText = '{'+parts[parts.length==1 ? 0 : 1].split('}')[0]+'}';
		} else {
			selectorText = selectorText[0];
		}
		return {
			styleSheet: $.trim(styleSheet.substr(0, styleSheet.length-1)),
			selectorText: normalizeSelector(selectorText.substr(1, selectorText.length-2))
		};
	}
	
	/**
	 * @function normalizeSelector
	 * Normalizes selectorText to work cross-browser
	 * @param {String} selectorText selector string to normalize
	 * @returns {String} normalized selector string
	 */
	function normalizeSelector(selectorText) {
		var selector = [], last, len;
		last = _sheet[_rules].length;
		insertRule.call(_sheet, selectorText, ';'); //NOTE: IE doesn't seem to mind ';' as non-empty
		len = _sheet[_rules].length;
		for(var i=len-1; i>=last; i--) {
			selector.push(_sheet[_rules][i].selectorText);
			deleteRule.call(_sheet, i);
		}
		return selector.reverse().join(', ');
	}
	
	/**
	 * @function matchSelector
	 * Matches given selector to selectorText of cssRule
	 * @param {CSSStyleRule} cssRule to match with
	 * @param {String} selectorText selector string to compare
	 * @param {Boolean} matchGroups when true, selector is matched in grouped style rules
	 * @returns true if selectorText of cssRule matches given selector, false otherwise
	 */
	function matchSelector(cssRule, selectorText, matchGroups) {
		if($.type(cssRule.selectorText) !== 'string') {
			return false;
		}
		
		if(cssRule.selectorText === selectorText) {
			return true;
		} else if (matchGroups === true) {
			return $($.map(cssRule.selectorText.split(','), $.trim)).filter(function(i) {
				return this.toString() === selectorText;
			}).length > 0;
		} else {
			return false;
		}
	}
	
	/**
	 * @function vendorPropName
	 * Vendor prefixed style property name.
	 * Based on similar function in jQuery library.
	 * @param {String} name camelCased CSS property name
	 * @returns {String} Vendor specific tag prefixed style name
	 * if found in styles, else passed name as-is
	 * @see vendorPrefixes
	 * @see _styles
	 */
	function vendorPropName(name) {
		var titleName = name[0].toUpperCase() + name.slice(1),
			styleName, i = vendorPrefixes.length;
		while( --i ) {
			styleName = vendorPrefixes[i] + titleName;
			if(styleName in _styles) {
				return styleName;
			}
		}
		return name;
	}
	
	/**
	 * @function normalizeRule
	 * Normalizes the CSSStyleRule object to work better across browsers
	 * @param {CSSStyleRule} rule CSSStyleRule object to be normalized
	 * @param {StyleSheet} styleSheet parent stylesheet of the rule
	 * @returns {CSSStyleRule} normalized CSSStyleRule
	 */
	function normalizeRule(rule, styleSheet) {
		//NOTE: this is experimental, however, it does have it's benefits
		//      for use with $.animate(), be sure to include jquery.stylesheet-animate.js as well
		//TODO: move some of the defaults used here to user options
		rule.ownerDocument = rule.ownerDocument || document; //XXX: Hack for jQuery.isHidden()
		rule.nodeType = rule.nodeType || 1; //XXX: Hack for jQuery's defaultPrefilter()
		rule.nodeName = rule.nodeName || 'DIV'; //XXX: Hack for jQuery's acceptData()
		rule.parentNode = rule.parentNode || styleSheet.ownerNode || styleSheet.owningElement; //XXX: Hack for jQuery.contains()
		rule.parentStyleSheet = rule.parentStyleSheet || styleSheet; //XXX: Fix for IE7
		return rule;
	}
	/*
	 * Checking for 'instanceof CSSStyleRule' fails in IE7 but not in IE8, however, the call to normalizeRule() fails in both.
	 * So, we will define our custom CSSStyleRule class on all browsers where normalizeRule() fails.
	 */
	try {
		normalizeRule(_sheet[_rules][0], _sheet);
		$.support.nativeCSSStyleRule = true;
	} catch(e) {
		$.support.nativeCSSStyleRule = false;
		CSSStyleRule = function(rule) {
			$.extend(this, rule);
			this.rule = rule; //XXX: deleteRule() requires the original object
			this.currentStyle = rule.style; //XXX: Hack for jQuery's curCSS()/getStyles() for IE7
		};
	}
	
	/**
	 * @function insertRule
	 * Cross-browser function for inserting rules
	 * @param {String} selector selectorText for the rule
	 * @param {String} css CSS property-value pair string
	 * @param {Number} index Index position to insert the string;
	 * defaults to end of rules collection
	 */
	function insertRule(selector, css, index) {
		if(!selector || !css) {
			return -1; //NOTE: IE does not like addRule(selector,'',index)
		}
		var self = this,
			_insfn = self.insertRule ? function (selector, css, index) { this.insertRule(selector+'{'+css+'}', index); } : self.addRule;
		index = index || this[_rules].length;
		try {
			return _insfn.call(self, selector, css, index);
		} catch(e) {
			$.each(selector.split(','), function(i, sel) {
				_insfn.call(self, $.trim(sel), css);
			});
			return -1;
		}
	}
	
	/**
	 * @function deleteRule
	 * Cross-browser function for deleting rules
	 * @param {Number|CSSStyleRule} Index of rule to be deleted, or
	 * reference to rule to be deleted from rules collection
	 */
	function deleteRule(rule) {
		//NOTE: If we are using our custom CSSStyleRule, then CSSStyleRule.rule is the real style rule object
		rule = (rule && rule.rule) ? rule.rule : rule;
		if(!rule) {
			return;
		}
		var self = this,
			_delfn = self.deleteRule || self.removeRule;
		if(!_delfn) { //NOTE: IE7 has issues with rule.parentStyleSheet, so we need to search for the parent stylesheet
			$(document.styleSheets).each(function (i, styleSheet) {
				if($(styleSheet[_rules]).filter(function() {return this === rule;}).length == 1) {
					self = styleSheet;
					_delfn = self.deleteRule || self.removeRule;
					return false;
				}
			});
		}
		if($.type(rule) == 'number') {
			_delfn.call(self, rule);
		} else {
			$.each(self[_rules], function (i, _rule) {
				if(rule === _rule) {
					_delfn.call(self, i);
					return false;
				}
			});
		}
	}
	
	/**
	 * jQuery.stylesheet
	 * 
	 * Constructor/Factory method for initializing a jQuery.stylesheet object.
	 * Includes a short-cut to apply style changes immediately.
	 * @param {String} selector CSS rule selector text with optional stylesheet filter  
	 * @param {String|Array|Object} name Name of style property to get/set.
	 * Also accepts array of property names and object of name/value pairs.
	 * @param {String} value If defined, then value of the style property
	 * is updated with it. Unused when name is an object map.
	 * @returns {jQuery.stylesheet|String|Object} A new jQuery.stylesheet object
	 * if name/value is not passed, or value of property or object of name/value pairs
	 */
	$.stylesheet = function (selector, name, value) {
		if(!(this instanceof $.stylesheet)) {
			return new $.stylesheet(selector, name, value);
		}
		
		this.init(selector);
		return this.css(name, value);
	};
	
	$.extend($.stylesheet, {
		/**
		 * @function jQuery.stylesheet.cssRules
		 * @param {String} selector CSS rule selector text with optional stylesheet filter
		 * @returns {Array} Array of CSSStyleRule objects that match the selector text
		 * and pass the stylesheet filter
		 */
		cssRules: function (selector) {
			var rules = [],
				filters = parseSelector(selector);
			//NOTE: The stylesheet filter will be treated as case-sensitive
			//      The selectorText filter's case depends on the browser
			$(document.styleSheets).each(function (i, styleSheet) {
				if(filterStyleSheet(filters.styleSheet, styleSheet)) {
					$.merge(rules, $(styleSheet[_rules]).filter(function() {
						return matchSelector(this, filters.selectorText, filters.styleSheet === '*');
					}).map(function() {
						return normalizeRule($.support.nativeCSSStyleRule ? this : new CSSStyleRule(this), styleSheet);
					}));
				}
			});
			return rules.reverse();
		},
		
		/**
		 * @function jQuery.stylesheet.camelCase
		 * jQuery.camelCase is undocumented and could be removed at any point
		 * @param {String} str Hypenated string to be camelCased
		 * @returns {String} camelCased string
		 */
		camelCase: $.camelCase || function( str ) {
			return str.replace(/-([\da-z])/g, function(a){return a.toUpperCase().replace('-','');});
		},
		
		/**
		 * Normalized CSS property names
		 * jQuery.cssProps is undocumented and could be removed at any point
		 */
		cssProps: $.cssProps || {},
		
		/**
		 * @function jQuery.styesheet.cssStyleName
		 * @param {String} name Hypenated CSS property name
		 * @returns {String} camelCased or vendor specific name if found in host styles
		 */
		cssStyleName: function (name) {
			if(name) {
				var camelcasedName = $.camelCase(name);
				if(camelcasedName in _styles) {
					return camelcasedName;
				} else if (($.cssProps[name] || ($.cssProps[name] = vendorPropName(camelcasedName))) in _styles) {
					return $.cssProps[name];
				}
			}
		}
	});
	
	$.stylesheet.fn = $.stylesheet.prototype = {
		/**
		 * @function jQuery.stylesheet.fn.init
		 * Initializes a jQuery.stylesheet object.
		 * Selects a list of applicable CSS rules for given selector.
		 * @see jQuery.stylesheet.cssRules
		 * @param {String|Array|Object} selector CSS rule selector text(s)
		 * with optional stylesheet filter(s)
		 */
		init: function (selector) {
			var rules = []; /**< Array of CSSStyleRule objects matching the selector initialized with */
			
			switch($.type(selector)) {
			case 'string':
				rules = $.stylesheet.cssRules(selector);
				break;
			case 'array':
				$.each(selector, function (idx, val) {
					if($.type(val) === 'string') {
						$.merge(rules, $.stylesheet.cssRules(val));
					} else if(val instanceof CSSStyleRule) {
						rules.push(val);
					}
				});
				break;
			case 'object':
				if(selector instanceof CSSStyleRule) {
					rules.push(val);
				}
				break;
			}
			
			$.extend(this, {
				/**
				 * @function jQuery.stylesheet.rules
				 * @returns {Array} Copy of array of CSSStyleRule objects used
				 * by this instance of jQuery.stylesheet 
				 */
				rules: function() {
					return rules.slice();
				},
				
				/**
				 * @function jQuery.stylesheet.css()
				 * @param {String|Array|Object} name Name of style property to get/set.
				 * Also accepts array of property names and object of name/value pairs.
				 * @param {String} value If defined, then value of the style property
				 * is updated with it. Unused when name is an object map.
				 * @returns {jQuery.stylesheet|String|Object} A new jQuery.stylesheet object
				 * if name/value is not passed, or value of property or object of name/value pairs
				 */
				css: function (name, value) {
					var self = this, styles = undefined;
					
					switch($.type(name)) {
					case 'null':
						$.each(rules, function (idx, rule) {
							deleteRule.call(rule.parentStyleSheet, rule);
						});
						//NOTE: Safari seems to replace the rules collection object on insert/delete
						//      Refresh our private collection to reflect the changes
						rules = $.stylesheet.cssRules(selector);
						return self;
					case 'string':
						var stylename = $.stylesheet.cssStyleName(name);
						if(stylename) {
							if(rules.length === 0 && value !== undefined) {
								var filters = parseSelector(selector),
									sheet = $(document.styleSheets).filter(function () {
										return filterStyleSheet(filters.styleSheet, this);
									});
								sheet = (sheet && sheet.length == 1) ? sheet[0] : _sheet;
								insertRule.call(sheet, filters.selectorText, name+':'+value+';');
								//NOTE: See above note on Safari
								//      Also, IE has different behaviour for grouped selectors 
								rules = $.stylesheet.cssRules(selector);
								styles = self;
							} else {
								$.each(rules, function (i, rule) {
									if(rule.style[stylename] !== '') {
										if(value !== undefined) {
											rule.style[stylename] = value;
											styles = self;
										} else {
											styles = rule.style[stylename];
										}
										return false;
									}
								});
								if(styles === undefined && value !== undefined) {
									rules[0].style[stylename] = value;
									styles = self;
								}
							}
						}
						break;
					case 'array':
						styles = {};
						$.each(name, function (idx, key) {
							styles[key] = self.css(key, value);
						});
						if(value !== undefined) {
							styles = self;
						}
						break;
					case 'object':
						$.each(name, function (key, val) {
							self.css(key, val);
						});
						return self;
					default: /*undefined*/
						return self;
					}
					
					return styles;
				}
			});
		}
	};
}));

// fix append_phase
OnCoreLoaded(Doh.ApplyFixes, function(){
  /*
   * Fixes for changing append_phase to html_phase
   */
  Doh.meld_objects(Doh.WatchedKeys, {
    append_phase:{rename:'html_phase'},
    pre_append_phase:{rename:'pre_html_phase'}
  });
  Doh.meld_objects(Doh.WatchedPhases, {
    append_phase:{rename:'html_phase'},
  });
});

OnLoad('/doh_js/html', function($){
  if(Doh.ApplyFixes){
    /*
     * Fixes for old pattern names that live in /doh_js/html
     */
     /*
    Doh.meld_objects(Doh.WatchedPatternNames, {
      //html_image:{rename:'image'},
      //checkbox2:{rename:'checkbox_click',throw:'find the clicks!'},
    });
    */
  }
  
  var jWin = $(window);
  Doh.meld_objects(Doh, {
    OnWindowResizeListeners:{},
    /**
     *  @brief Turns a string or jquery object into a doh object
     *
     *  @param [in] e jQuery String Selector, jQuery Selector Object, or Doh Object
     *  @return Doh Object or empty jQuery Selector Object
     */
    get_dobj: function( e ) {
      var object = e;
      if( typeof e == 'string' ) {
        // if it's a string, then it's a jquery selector
        object = Doh.jQuery(e);
      }
      if( object instanceof Doh.jQuery ) {
        // if it's a jquery object, find the dobj that built it
        if( object[0] ){
          if( object[0].dobj ) object = object[0].dobj;
          // or make a new one for it
          // TO ANDY: I don't think we use this and I don't really like it.
          // test raising warning
          else{
            Doh.warn('Doh.get_dobj(',e,") found a jQuery object that we didn't build.");
            object = New({pattern:'element', e:object, parent:object.parent()}, 'parenting_phase');
          }
        }
        // the jQuery selector object is empty, we didn't find an actual element
        else object = false;
      }
      if(!InstanceOf(object)){
        Doh.warn('Doh.get_dobj could not find a doh object with:', e);
      }
      // in any case, at least return e
      return object || e;
    },
    /**
     *  @brief Refresh this window's cached sizes and boxes
     *
     *  @return the cache object
     *
     *  @details N/A
     */
    refresh_win: function() {
      // cache the window size on doh
      // window h/w is happily consistent

      var DWS = Doh.WindowSizes = Doh.win = {w:jWin.width(), h: jWin.height()};
      // floor to err on the size of fitting
      // we stash this to keep from dividing by 2 as much as possible
      DWS.w2 = Math.floor(DWS.w*0.5);
      DWS.h2 = Math.floor(DWS.h*0.5);

      // In HTML land, the x,y coords 0,0 are in the top,left of the screen
      DWS.box = {
        t:0,
        l:0,
        r:DWS.w,
        b:DWS.h
      }

      // stash 'full' and 'half' css objects for jQuery and target_offset
      DWS.css = {top:DWS.h, left:DWS.w};
      DWS.center = {top:DWS.h2, left:DWS.w2};
      return DWS;
    },
  });

  // refresh the window sizes as soon as possible
  Doh.refresh_win();

  // AA: describe how this relates to the control phase
  // Also, this is an example of a developer-facing method (as opposed to internal build machinery) -- should we have a naming convention to make that difference clear?
  // NOTE: get_controller_from_parents
  Doh.find_controller = function(object){
    // if the object is not of doh, then return false
    //NOTE: this keeps controls from cascading past their defined parents (e.g.: into vanilla html that contaiins them)
    if(!InstanceOf(object)) return false;
    if(object.parent){
      //if the parent is a controller, use that
      if(object.parent.is_controller) return object.parent;
      //otherwise, if the parent HAS a controller, use that
      if(object.parent.controller) return object.parent.controller;
      //otherwise, search for a controller
      return Doh.find_controller(object.parent);
    }
    // we have no parent, or we found no controller
    return false;
  }


  // AA:  A good place for an essay about the control system
  
  Pattern('control', 'parenting', {
    // advance the children machine to this phase when building
    machine_children_to: 'control_phase',
    // setup our phases for building controls
    melded:{
      control_phase:'phase'
    },
    control_phase: function(){
      if(!this.control)if(this.parental_name) this.control = this.parental_name;
      // if we have a control name
      if(this.control){
        // find the controller
        var controller = Doh.find_controller(this);
        // if we find one, use it
        if(controller){
          this.controller = controller;
        } else {
          // otherwise, use the parent with warning
          Doh.warn('hierarchy control:', this, 'could not find a controller. Use the parent:', this.parent, 'instead.');
          this.controller = this.parent;
        }
        // ensure that our newly assigned controller has controls storage
        this.controller.controls = this.controller.controls || {};
        // add ourself to it
        this.controller.controls[this.control] = this;
      }
      // make our children keep up with us in the phases
      //if(this.machine_children_to === 'control_phase') this.machine_children(this.machine_children_to);
    },
  });
  

  // AA: We should explain how css fits into the Doh development workflow
  // AA:  that can mostly go in the README buy maybe some breadcrumbs here?
  var CSSClassCache = {};
  let originalPatternize = Doh.pattern;
  Pattern = Doh.pattern = function(name, inherits, idea) {
  //let off = function(name, inherits, idea) {
    var newPattern = originalPatternize(name, inherits, idea);
    if(!newPattern) return;
    if(SeeIf.NotEmptyObject(newPattern.css) || SeeIf.HasValue(newPattern.style)){
      // build a class from .css and .style here
      // create a class name
      var className = 'doh-' + newPattern.pattern;
      var newCSS = {};
      //newPattern.css_old = Doh.meld_objects({},newPattern.css);
      //newPattern.style_old = newPattern.style;
      //newPattern.pattern_styles_old = newPattern.pattern_styles;
      // get styles, if any
      if(newPattern.style){
        newPattern.style.split(';').forEach((a) => {
          var oldPatterrn = newPattern;
          var b = a.split(':');
          if(SeeIf.HasValue(b[0]) && SeeIf.HasValue(b[1])){
            newCSS[(b[0]).trim()] = b[1].trim();
          }else{
            //Doh.warn('Patterns failed parsing: '+ a);
          }
        });
      }
      
      for(var i in newPattern.css){
        if(i === 'z-index') continue;
        if(i === 'opacity') continue;
        if(SeeIf.IsNumber(newPattern.css[i])){
          Doh.warn('Pattern (' + newPattern.pattern + ')found css number for: ' + i + ' of: ' + newPattern.css[i] + ' .', 'The value may be ignored!' , newPattern);
        }
      }
      
      // get css, if any;
      Doh.meld_objects(newCSS, newPattern.css);
      
      // add our class to a stylesheet
      $.stylesheet('#dynamic  {.'+className+'}').css(newCSS);
      // add our class to the pattern's classes
      newPattern.classes = Doh.meld_arrays(newPattern.classes || [], [className]);
      // clear the properties so they aren't added to the final object
      newPattern.initial_css = newPattern.css;
      newPattern.css = {};
      newPattern.initial_style = newPattern.style;
      newPattern.style = '';
      
    }
    return newPattern;
  }
  
  Doh.fix_untitled_controls = function(){
    // if doh previously identified things that it constructed which did not have a title
    if(Doh.UntitledControls){
      console.groupCollapsed('Doh.fix_untitled_controls Returned:');
      let DUC;
      for(var id in Doh.UntitledControls){
        DUC = Doh.UntitledControls[id];
        // we are still a control?
        if(DUC.control){
          // did we set a title?
          if(DUC.attrs.title){
            // ok, so something set our title, is it at least not empty string on the actual DDM object?
            if(SeeIf.IsEmptyString(DUC.e.attr('title'))){
              // so we wanted it to be set but it's empty on the DOM object, fix that:
              Doh.log('Tooltip title was set BUT it was deleted. Restored to the value originally set.', DUC.id, 'Pattern:', DUC.pattern, '.control:', DUC.control);
              DUC.e.attr('title', DUC.attrs.title);
            }
          } else {
            // so we didn't set a title, but did a title get set by someone else?
            if(!DUC.e.attr('title')){
              // no title was set and it was never updated up to this point
              Doh.log('Tooltip title was not set AND it was never updated. Set to .control', DUC.id, 'Pattern:', DUC.pattern, '.control:', DUC.control);
              DUC.e.attr('title', DUC.control);
            } else {
              // a title was not defined by us, but someone updated us to have one, which somehow seems fine for now
              Doh.log('Tooltip title was not set BUT it was updated later. Abort.', DUC.id, 'Pattern:', DUC.pattern, '.control:', DUC.control);
            }
          }
        }
      }
      console.groupEnd();
    }
  }

  // AA:  A discussion of the interface between DOM elements and the html pattern should go here
  
  Pattern('html', 'control', {
    melded:{
      classes:'array',
      css:'object',
      attrs:'object',
      html_phase:'phase'
    },
    // e should be a jQuery [Element/Array]
    // or false for using a passed in selector
    e: false,
    // used when e = false and we are generating a new element
    tag: 'div',
    // provided for selectors
    id: '',
    // attributes to set on the element by name:key
    attrs: {},
    // should always be a number keyed array of classes, will be .unique()
    classes: ['doh'],
    // css will be deep copied so it is safe to send in to any element modifier
    css: {},
    // html content to be added before appending children
    html: '',

    object_phase:function(){
      // if our auto-built properties don't have a parent, make us the parent
      if(this._auto_built_by) {
        this.parent = this.parent || this._auto_built_by;
      }
      // ensure that the parent is a setting, already set,
      // or the body
      this.parent = this.parent || 'body';
      // convert to DohObject if we are a string selector
      if( typeof this.parent === 'string' ) {
        this.parent = Doh.get_dobj(this.parent);
      }
      // ensure that the element is a setting, already set, or a new jQuery element using this.tag
      this.e = this.e || $('<'+this.tag+'>');
      if( typeof this.e === 'string' ) {
        // if it's a string, then it's a jquery selector
        this.e = $(this.e);
      }
      // stash ourself on the DOM object for the Doh.get_dobj() function later
      this.e[0].dobj = this;

      // if we made it this far and still have no id, then we need to assign a new one
      if(this.e.length === 1 && !this.id) {
        var id = this.e.attr('id')
        if(id) { this.id = id; }
        else { this.id = 'dobj_'+Doh.new_id(); }
      }
    },
    pre_parenting_phase:function() {
      if(this.e) {
        // set style before css so it doesn't blow the css away
        if(this.style) this.set_style(this.style);

        this.e
          // add any classes
          .addClass(this.classes.join(' '))
          // merge in css
          .css(this.css)
          // apply attributes
          .attr(this.attrs)
          
        // only try and set html if it's actually set to something
        if(SeeIf.NotEmptyString(this.html)){
          // ... and there aren't already children
          if(this.e.children().length < 1) {
            // set inner text
            // WARNING: this will overwrite children
            this.e.html(this.html);
          } else {
            Doh.warn(`html object tried to overwrite children with: "${this.html}"`,'\n',this);
          }
        }
        
        // set id for selectors/readability
        if(this.e.length === 1 && this.id) this.e.attr('id', this.id);
        // we rely on children waiting to be appended,
        // stash the intended machine state and use 'control_phase'
        if(this.machine_children_to !== 'control_phase'){
          this._machine_children_to = this.machine_children_to;
          this.machine_children_to = 'control_phase';
        }
      }
    },
    parenting_phase:function(){
      if(this._machine_children_to){
        // if we stashed the intended state, restore it here
        this.machine_children_to = this._machine_children_to;
        // if this is already past then we need to be append phase
      } else {
        // tell the append to machine children to html_phase
        this.machine_children_to = 'html_phase';
      }
    },
    html_phase:function(){
      // as long as we haven't already appended:
      if(!this.machine.completed.html_phase) {
        
        // convert the parent to a doh object if not already one
        if( typeof this.parent === 'string' || this.parent instanceof Doh.jQuery) {
          Doh.warn('html_phase found a parent:',this.parent,'that was a string or jQuery instance');
          this.parent = Doh.get_dobj(this.parent);
        }
        
        // if this is a string, convert it to a jQuery object
        if( typeof this.e === 'string' ) {
          this.e = $(this.e);
          // if we had to convert, then stash ourself on the DOM object, just in case
          this.e[0].dobj = this;
        }
      }
      // every time html phase is called:
      if(!this.parent.e){
        Doh.warn('html_phase found a parent:',this.parent,'that has no .e:',this.parent.e);
        this.parent = Doh.get_dobj(this.parent);
      }
      // put in parent (can be used to relocate as well)
      this.parent.e.append(this.e);

      this.machine_children(this.machine_children_to);
      
      if(this.control && !this.attrs.title && ! this.e.attr('title')){
        Doh.UntitledControls = Doh.UntitledControls || {};
        Doh.UntitledControls[this.id]=this;
      }
      
      if(Doh.ApplyFixes){
        this.machine.completed.append_phase = true;
      }
    },
    get_style:function(){
      return this.e[0].style.cssText;
    },
    set_style:function(style){
      this.e[0].style.cssText = style;
    },
    // set_css({prop:val}) OR set_css(prop, val) OR set_css("prop:val;")
    set_css: function(o, p = undefined) {
      if(typeof p !== 'undefined') {
        this.e[0].style[o] = p; 
      } else if(typeof o === 'string') {
        o.split(';').forEach((a) => {
          let b = a.split(':');
          this.e[0].style[(b[0])] = b[1]; 
        });
      } else 
        this.e.css(o);
    },
    is_visible: function(){
      return this.e.is(":visible");
    },
    // cache the sizes of the object for the current moment
    sizes:function () {
      // jQuery outerWidth and outerHeight give us padding and border, but not margin
      // since doh is absolute position, only margin does NOT affect the layout
      // therefore, we must use the outer measurements to get acurate positions
      var s = this.size = {w:this.e.outerWidth(), h:this.e.outerHeight()};
      // store pre-halved values, so we can easily center
      s.w2 = s.w*0.5;
      s.h2 = s.h*0.5;

      // cache the internal size for containers
      var i_s = this.inner_size = {w:this.e.width(), h:this.e.height()};
      i_s.w2 = i_s.w*0.5;
      i_s.h2 = i_s.h*0.5;

      return this;
    },
    offsets:function () {
      // cache the current jQuery offsets
      this.offset = this.e.offset();
      return this;
    },
    // cache the boxes of the object for the current moment
    boxes:function () {
      //ensure that we have sizes and offsets
      this.sizes();
      this.offsets();
      var s = this.size, o = this.offset;
      // calculate the box against it's actual coords
      // cache a jQuery friendly set of targeted box offsets for use in .css calls
      this.box = {
        t:o.top,
        l:o.left,
        r:o.left+s.w,
        b:o.top+s.h,
        css:{
          top:o.top,
          left:o.left,
          width: s.w,
          height: s.h,
        }
      };
      return this.box;
    },
  });

// AA:  we never use this.  is it the future or is it further entanglement with jquery?

  Pattern('HTMLPosition', 'element', {
    melded:{position:'object'},
    position:{},
    place:function(opts){
      opts = opts || this.position;
      let newOpts = {};
      if(InstanceOf(opts.of)) newOpts.of = opts.of.e;
      if(InstanceOf(opts.within)) newOpts.within = opts.within.e;
      this.e.position({...opts, ...newOpts});
    }
  });

  // AA:  This needs some explanation

  Doh.AnimationQueues = {doh:[]};
  Doh._AnimationQueues = {};
  Doh.animation_functionalizer = function(oThat, oAnim){
    var that = oThat, anim = oAnim;

    var opts = $.extend({},{duration:400},that.animation_options);

    if(typeof anim === 'string'){
      if(anim === 'delay') return function(next){that.machine('animation_phase');setTimeout(next, opts.duration)};
      return function(next){that.machine('animation_phase');that.e[anim]($.extend({},opts,{complete:next}));};
    }

    if(typeof anim === 'function'){
      return function(next){that.machine('animation_phase');anim.apply(that);next();};
    }

    return function(next){
      that.machine('animation_phase');
      that.e.animate(anim, $.extend({},opts,{complete:next}));
    };
  }
  Doh.run_animation_queue = function(queue_name){
    if(!queue_name){
      Doh.warn('Tried to start a "false" animation queue. (i.e.: Doh.run_animation_queue(). A queue_name is required)');
      return;
    }
    queue = Doh.AnimationQueues[queue_name];
    if(Doh._AnimationQueues[queue_name]){

      if(!Doh._AnimationQueues[queue_name][0]){
        Doh._AnimationQueues[queue_name] = false;
        return;
      }
      var next = Doh._AnimationQueues[queue_name][0];
      Doh._AnimationQueues[queue_name] = Doh._AnimationQueues[queue_name].slice(1);
      next(Doh.run_animation_queue.bind(this, queue_name));

    } else {
      Doh._AnimationQueues[queue_name] = [];
      var q = false, j = 0;
      if(queue)
        for(var i = 0; i < queue.length; i++){
          if(InstanceOf(queue[i])){
            // it's a doh object,
            // the animation is either an array of animations,
            // or a single animation
            q = queue[i].animation;
            if(!Array.isArray(q)) q = [q];
            // its an array of animations
            j = 0;
            for(j; j < q.length; j++){
              Doh._AnimationQueues[queue_name].push(Doh.animation_functionalizer(queue[i],q[j]));
            }
          }
        }
      Doh.run_animation_queue(queue_name);
    }
  }
  Pattern('animation_queue', 'object', {
    queue: false,
    animation:[],
    animation_options: {},
    melded:{
      animation_phase:'phase',
      animation_options:'object'
    },
    animation_phase: function() {
      this.queue = this.queue || 'doh';
      if(!Doh.AnimationQueues[this.queue])Doh.AnimationQueues[this.queue]=[];
      Doh.AnimationQueues[this.queue].push(this);
    }
  });

  Pattern('animated_element', ['element','animation_queue'], {
    machine_children_to: 'animation_phase'
  });

  // AA:  It's a small thing, but I would move these html primitive upwards, so they are directly below 'html' itself.

  Pattern('span', 'element', {tag:'span'});

  Pattern('input', 'element', {
    tag: 'input'
  });

  Pattern('input_value', {
    available_properties:{'value':'string to put in the value HTML attribute'},
    pre_parenting_phase: function(){
      if (typeof this.value !== 'undefined') this.attrs.value = this.value;
    }
  });

  Pattern('text', ['input', 'input_value'], {
    attrs: {type: 'text'},
  });

  Pattern('password', ['input', 'input_value'], {
    placeholder: '',
    object_phase: function() {
      this.attrs = {type: 'password', placeholder: this.placeholder};
    }
  });


  Pattern('hidden', ['input', 'input_value'], {
    attrs: {type: 'hidden'}
  });

  Pattern('textarea', ['input'], {
    available_properties:{'value':'string to put in the textarea'},
    tag: 'textarea',
    attrs: {spellcheck: 'false'},
   html_phase: function () {
      if (typeof this.value !== 'undefined')
        this.e.val(this.value);
    }
  });

  Pattern('click', 'element', {
    wait_for_mouse_up:false,
    css:{'cursor':'default'},
    html_phase: function(){
      if(this.click){
        var that = this;
        if(this.wait_for_mouse_up) {
          this.e.mouseup(function(){return that.click.apply(that,arguments);});
        } else 
          this.e.click(function(){return that.click.apply(that,arguments);});
        // CHRIS -- test this
        // if the click function returns false, the click doesn't propagate
      }
    }
  });
  Pattern('button', ['click', 'disableable'], {
    tag: 'button',
    available_properties: {'value':'label of the button', 'button_options':'jQuery UI Button options object'},
    melded:{button_options:'object'},
    button_options: {},
    pre_parenting_phase: function(){
      if (typeof this.value !== 'undefined' && typeof this.button_options.label == 'undefined') this.button_options.label = this.value;
    },
    html_phase: function(){
      this.e.button(this.button_options);
    },
    change_title: function(wut) {
      if(this.e)
        this.e[0].innerHTML = wut;
    },
  });

  // AA: As we discussed, this guy should be migrated out of core

  Pattern('animated_next_button', ['animated_element','button','scenario_queue_stepper'], {
    animation:['fadeIn'],
    click_queue:false,
    click_animation:['fadeOut',function(){if(this.next_queue)Doh.run_animation_queue(this.next_queue);}],
    next_queue:false,
    melded:{click:'method'},
    html_phase:function(){
      this.click_queue = this.click_queue || this.id+'_click';
      this.original_queue = this.queue;
      this.original_animation = this.animation;

      this.queue = this.click_queue;
      this.inherited.animation_queue.animation_phase.apply(this);
      this.queue = this.original_queue;
    },
    pre_click:function(){
      this.animation = this.click_animation;
    },
    click:function(){
      Doh.run_animation_queue(this.click_queue);
      this.animation = this.original_animation;
    }
  });

  Pattern('disabled', 'element', {
    attrs: {disabled:'disabled'}
  });

  Pattern('disableable', 'element',{
    disable: function(aBool) {
      if(this.e)
        if(aBool) {
          //this.e.prop('disabled',true).css('opacity',0.3);
          this.e.addClass('ui-state-disabled');
        } else {
          //this.e.prop('disabled',false).css('opacity',1.0);
          this.e.removeClass('ui-state-disabled');
       }
    }
  });

  Pattern('disabled_text', ['text', 'disabled']);

  Pattern('select', ['input', 'disableable'], {
    required_properties:{'options':'object array of options keyed by option title, value used as option value'},
    available_properties:{'value':'string of the option value that should be default selected'},
    tag: 'select',
    pre_parenting_phase: function() {
      for(var i in this.options){
        this.children.push({
          pattern: 'option',
          html: i,
          value: this.options[i]
        });
      }
    },
    html_phase: function () {
      if (this.value) {
        this.e.find("[value='" + this.value + "']").attr({
          selected: 'selected'
        });
      }
      if (this.change) {
        var that = this;
        this.e.bind('change', function(){that.change.apply(that, arguments)});
        window.setTimeout(this.change, 0);
      }
    },
  });

  Pattern('option', 'element', {
    tag: 'option',
    html_phase: function () {
      if (typeof this.value !== 'undefined') this.e.val(this.value);
    }
  });

  // AA: As we discussed, this guy should be migrated out of core

  Pattern('select_with_other_field', 'select', {
    required_properties:{
      other_value: 'value of the option that shows "other" field when selected',
      other_selector: 'jquery selector for "other" field'
    },
    html_phase: function () {
      var that = this;
      var chg = function () {
        var form_dobj = that.e.parentsUntil('.form').parent()[0].dobj;
        var container = that.e.parent().parent();
        var other_field = container.find(that.other_selector);
        var value = that.e.val();
        if (value == that.other_value) {
          // if the select is on the "other" value, show the "other" field
          other_field.show();
        } else {
          // otherwise, clear the "other" field and hide it
          if(form_dobj.clear_fields) form_dobj.clear_fields(other_field);
          other_field.hide();
        }
      };
      this.e.bind('change', chg);
      window.setTimeout(chg, 0);
    }
  });

  Pattern('checkbox', ['input', 'input_value'], {
    attrs: {type: 'checkbox'},
  });

  Pattern('checkbox_click', 'checkbox', {
    html_phase: function(){
    //  this.e.button(this.button_options);
      if(this.click){
        var that = this;
        this.e.click(function(){that.click.apply(that,arguments);});
      }
    },
  });
  
  Pattern('date', 'text', {
    available_properties:{'value':'string of the option value that should be default selected'},
    html_phase: function(){
      var that = this;
      this.e.removeClass('hasDatepicker');
      this.date_format = this.date_format || 'yy-mm-dd';
      this.e.datepicker({
        showOn: "focus",
        dateFormat: this.date_format,
        constrainInput: true,
        changeMonth: true,
        changeYear: true,
        minDate: '01/01/1900',
        yearRange: this.year_range || 'c-100:c',
        onClose: function(date_str){
          if(date_str) that.e.val(date_str);
          that.e.trigger('input');
        }
      });
    }
  });

  Pattern('date_range_from', 'date', {
    html_phase: function(){
      var that = this;
      this.e.on('change', function(){
        $(that.date_range_to).datepicker("option", "minDate", date_range_get_date(this, that.date_format));
      });
    }
  });

  Pattern('date_range_to', 'date', {
    html_phase: function(){
      var that = this;
      this.e.on('change', function(){
        $(that.date_range_from).datepicker("option", "maxDate", date_range_get_date(this, that.date_format));
      });
    }
  });

  function date_range_get_date(e, dateFormat) {
    var date;
    try {
      date = $.datepicker.parseDate(dateFormat, e.value);
    } catch(error) {
      date = null;
    }
    return date;
  }

  Pattern('slider', 'element', {
    available_properties: {'slider_options':'jQuery UI Slider options object'},
    melded:{slider_options:'object'},
    slider_options: {},
    html_phase: function(){
      this.e.slider(this.slider_options);
    }
  });

  Pattern('field', 'element', {
    tag: 'span'
  });

  Pattern('label', 'element', {
    tag: 'span',
    set_html: function(s) {
      this.html = s;
      if (this.e.children().length < 1) {
        // set inner text
        // WARNING: this will overwrite children
        this.e.html(this.html);
      } else {
        Doh.warn(`set_html would have overwritten children with: "${this.html}"`, '\n', this);
      }
    }
  });

  Pattern('html_image','span', {
    src_path: false,
    tag: 'img',
    html_phase: function() {
      if(this.src_path)
        this.set_src(this.src_path);
    },
    set_src: function(src_path) {
      this.src_path =  src_path;
      Doh.log('set_src',this.src_path);
      this.e[0].setAttribute('src',this.src_path);
    }
  });

  Pattern('fieldset', 'element', {
    available_properties:{
      'legend':'string use as the fieldset "legend" or title',
      'children':'object or array of children objects or patterns that will be placed in the fieldset'
    },
    tag: 'fieldset',
    pre_parenting_phase: function () {
      var new_children = {};
      new_children.push({
        tag: 'legend',
        html: this.legend
      });
      for(var i in this.children){
        if(i == 'length') continue;
        new_children[i] = this.children[i];
      }
      this.children = new_children;
    }
  });

  //TODO: refactor for pre_parenting_phase
  Pattern('form_messages', 'element', {
    pre_parenting_phase: function(){
      var that = this;
      for(var i in this.messages){
        this.children.push({
          pattern: 'form_msg',
          html: this.messages[i]
        });
      }
      setTimeout(function(){
        that.e.slideUp();
      }, 10000);
    }
  });

  Pattern('form_msg', 'element',);

  //TODO: refactor for pre_parenting_phase
  Pattern('tabs', 'element', {
    tabs: {},
    required_properties:{
      'tabs':'Object containing tabs, keyed by tab label, value is tab content'
    },
    pre_parenting_phase: function(){
      var tab_labels = {}, tab_content = {}, active = '';
      for(var i in this.tabs){
        this.tabs[i].css = {clear: 'both'};
        if(i === 'Normal'){
          active = 'active'
        } else {
          active = '';
          this.tabs[i].css.display = 'none';
        }
        this.tabs[i].id = 'tab_'+i+'_content';
        tab_content[i] = this.tabs[i];
        tab_labels[i] = {
          pattern: 'button',
          value: i,
          classes: [active],
          css: {float: 'left'},
          id: 'tab_' + i + '_button',
          name: i,
          html_phase: function(){
            var that = this;
            //var tab_labels_inner = tab_labels, tab_content_inner = tab_content;
            this.e.click(function(){
              //Doh.log(that);
              var cur_button, cur_content;
              for(var k in tab_content){
                cur_button = $('#tab_' + k + '_button');
                cur_content = $('#tab_' + k + '_content');
                if(that.name == k){
                  cur_button.addClass('active');
                  cur_content.show();
                } else {
                  cur_button.removeClass('active');
                  cur_content.hide();
                }
              }

            });
          }
        };
      }
      this.children = tab_labels;
      for(var j in tab_content){
        this.children['tab_'+j+'_content'] = tab_content[j];
      }
    }
  });

  Pattern('dialog', 'element', {
    melded:{dialog_options:'object'},
    dialog_options:{height:'auto',width:'auto'},
    html_phase: function(){
      /*
        see https://api.jqueryui.com/dialog/ 

        position: {
            my: 'left',
            at: 'left',
            of: this.e[0]
          },
         title: 'foo',
         classes: {
          "ui-dialog": "disrupter_site",
          "ui-dialog-titlebar": "disrupter_site",
          "ui-dialog-title": "disrupter_site",
          "ui-dialog-buttonpane": "disrupter_site",
        }
         Note:  there is a deprecated "dialogClass" option which should be avoided

      */
      this.e.dialog(this.dialog_options);
    }
  });

  Pattern('modal_dialog','dialog',{
    tag:'pre',
    is_controller:true,
    on_close:function(){},
    perform_close:function(){
      this.e.dialog('close');
      this.on_close();
    },
    object_phase:function(){
      var aDialog = this;
      this.dialog_options = Doh.meld_objects(this.dialog_options || {},{
        modal:'true',
        buttons:{
          "OK":function(){
            aDialog.perform_close();
          }
        },

      });
    },
    html_phase:function(){
      var aDialog = this;
      this.e.keypress(
        function(event){
           var keycode = (event.keyCode ? event.keyCode : event.which);
           if(keycode == 13) {
            aDialog.perform_close();
           }
         }
      );
    },
  });

  // AA: because this is my favorite pattern, can we move it up closer to a place of honor near 'html'?

  Pattern('drag', 'element', {
    melded:{drag_start:'method',drag_drag:'method',drag_stop:'method'},
    css: {cursor: "move"},
    drag_start:function(event, ui){
      this._original_z_index = this.e.css("z-index");
      this.e.css({'z-index':110});
      //Doh.log('drag start');
    },
    drag_drag:function(event, ui) {
      //Doh.log('drag drag');
    },
    drag_stop:function(e,f) {
      this.e.css({'z-index':this.css['z-index']});
       this.e.css({'z-index':this._original_z_index});
       this._was_gedragged = true;
    },
    html_phase: function(){
      this.e.draggable({
        start: this.drag_start.bind(this),
        drag: this.drag_drag.bind(this),
        stop: this.drag_stop.bind(this)
      });    
    },
    enableDrag: function() {
      this.e.draggable('enable');
    },
    disableDrag: function() {
      this.e.draggable('disable');
    },
  });

  Pattern('draggable', 'drag',{});

  Pattern('resizable', 'element', {
    melded:{
      resize_start:'method',
      resize:'method',
      resize_stop:'method'
    },
    resize_start:function(event, ui){
    },
    resize:function(event, ui) {
    },
    resize_stop:function() {
    },
    html_phase: function(){
      if(InstanceOf(this,'html_image') || this.tag == 'img') Doh.warn('resizable behaves oddly with <img> elements, it would be better to wrap it in a generic element and let THAT do the resizing (setting width and height of the nested <img> to 100%.')
      this.e.resizable({
        start: this.resize_start.bind(this),
        resize: this.resize.bind(this),
        stop: this.resize_stop.bind(this)
      });    
    },
    enableResize: function() {
      this.e.resizable('enable');
    },
    disableResize: function() {
      this.e.resizable('disable');
    },
  });

  Pattern('hover', 'element', {
    melded:{hover_over:'method',hover_out:'method'},
    hover_over: function(){},
    hover_out: function(){},
    html_phase: function(){
      // make us hoverable
      this.e.hover(this.hover_over.bind(this), this.hover_out.bind(this));



      //window.setTimeout(this.hover_over, 0); // this fixes a race issue at launch but means hover will get called at launch one time
    },
  });

  Pattern('hover_delayed', 'element', {
    delay_time_ms: 600,
    melded:{hover_over:'method',hover_out:'method'},
    _timer: null,
    delays_hover_over: function() {
      let that = this;
      this._timer = setTimeout(function() {
        that.hover_over();
    }, this.delay_time_ms);
    },
    hover_over: function(){

    },
    hover_out: function(){
      clearTimeout(this._timer);
    },
    html_phase: function(){
      // make us hoverable
      this.e.hover(this.delays_hover_over.bind(this), this.hover_out.bind(this));
      //window.setTimeout(this.delays_hover_over, 0); // this fixes a race issue at launch but means hover will get called at launch one time
    },
  });
  
  Doh.jQuery(window).resize(function(e){
    Doh.refresh_win();
    for(var id in Doh.OnWindowResizeListeners) {
      Doh.OnWindowResizeListeners[id].window_resize.call(Doh.OnWindowResizeListeners[id], e);
    }
  });

  var jBody = Doh.jQuery('body');
  Doh.body = New('html',{tag:'body',e:jBody,parent:jBody.parent()}, 'parenting_phase');                 
});

OnLoad('/doh_js/element', function($){Pattern('element', 'html');});

OnLoad('/doh_js/patterns', function($){});
