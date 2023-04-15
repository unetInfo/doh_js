"use strict"
// this is for loading into a nodejs system
if(typeof global !== 'undefined'){
  window = global;
  Doh = window.Doh = {};
  glob = window.glob = {};
  SeeIf = window.SeeIf = {};
  PatternModuleVictors = window.PatternModuleVictors || {};
}


if(!Doh) Doh = {};

// This has to be very early.
// we try not to use this now that the url paramater is working
//Doh.DebugMode = true;
Doh.ReduceWarnings = !Doh.DebugMode;

// this is for being required by a nodejs module
if(typeof exports != 'undefined') {
  exports = top.Doh;
}

/* **** Prepare Doh **** */
/**
 *  @brief Shallow-meld multiple objects (arguments) into destination
 *  
 *  @param [in] destination   [object/falsey] the thing to add everrthing else onto. If falsey, a default of {} will be used.
 *  @param [in] ...arguments  [object]        all additional paramaters will be added in the order they are passed so that the last passed will override everyone else.
 *  @return destination
 *  
 *  @details Over the years, meld_objects has been wholly replaced with the more optimized Object.assign.
 *           They are identical in purpose and implementation.
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
  /**
   *  This is a library of utility functions that can be used for type checking and conditional operations 
   *  in JavaScript. The functions are all defined in the SeeIf object, which is first defined as an empty 
   *  object and then extended with the various functions.
   *  
   *  The functions cover a range of type checks, including checking whether a value is:
   *  undefined, 
   *  null, 
   *  a string, 
   *  a function, 
   *  a boolean, 
   *  a number (excluding NaN), 
   *  an array, 
   *  a Doh object (a complex object built with Doh), 
   *  or an object with named properties (i.e., not an array or literal).
   *  
   *  In addition to these basic type checks, the library also includes functions for checking whether a 
   *  value is:
   *  "defined" (usable), 
   *  "true" (binary 1), 
   *  "false" (binary 0), 
   *  "truey" (values that equal binary 1, even if represented by a different data type), 
   *  "falsey" (values that equal binary 0, even if represented by a different data type), 
   *  "nullish" (effectively the opposite of "defined"), 
   *  "arraylike" (values that act like arrays in every way), 
   *  "iterable" (values that define a Symbol iterator so that native methods can iterate over them), 
   *  "enumerable" (values that can be iterated over in a for/in loop), 
   *  "literal" (values that are static literals, i.e., not objects or arrays), and 
   *  "emptyobject" (values that are object objects or arraylike but have no properties of their own).
   *  
   *  Many of the functions are fairly straightforward, but some require a bit more explanation. 
   *  For example, the IsNull function checks whether a value is null, which seems straightforward, 
   *  but it's worth noting that null is a special value in JavaScript that represents the intentional 
   *  absence of any object value. It is distinct from undefined, which is used to represent variables 
   *  that have not been initialized, parameters that have not been provided, or missing properties on 
   *  objects.
   *  
   *  Similarly, the NotNumber function checks whether a value is not a number or is NaN (Not a Number), 
   *  which is another special value in JavaScript that indicates an unrepresentable value resulting from 
   *  an operation. NaN is unique in that it is not equal to any value, including itself, so it requires 
   *  a specific check to identify it.
   *  
   *  Overall, the SeeIf library provides a powerful set of functions for checking the types of values and 
   *  executing conditional operations based on those types. By using these functions, JavaScript developers 
   *  can write more robust and error-resistant code that can handle a wider range of possible values and 
   *  data types.
   */
  let SeeIf = window.SeeIf || {};
  // enshrine the definitions of variable states in the SeeIf library
  Object.assign(SeeIf, {
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
    IsArray:        (value) => {return Array.isArray(value)?true:false ;},
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
    // truey referes to values that equal binary 1, even if represented by a different datatype. Truey values include: True, 'any string', any_object, HasValue, 1...[positive numbers]
    IsTruey:        (value) => {return value?true:false ;},
    // falsey refers to values that equal binary 0, even if represented by a different datatype. Falsey values include: Undefined, Null, False, '', 0, -1...[negative numbers]
    IsFalsey:       (value) => {return value?false:true ;},
    // nullish refers to effectively the opposite of defined
    IsNullish:      (value) => {return (typeof value === 'undefined' || value === null) ;},
    // arraylike refers to values that act like arrays in every way. they can be used by native array methods
    IsArrayLike:    (value) => {return (Array.isArray(value) || ((typeof value !== 'undefined' && value !== null) && typeof value[Symbol.iterator] === 'function') && typeof value.length === 'number' && typeof value !== 'string') ;},
    // iterable refers to values that define a Symbol iterator so that native methods can iterate over them
    IsIterable:     (value) => {return ((typeof value !== 'undefined' && value !== null) && typeof value[Symbol.iterator] === 'function') ;},
    // enumerable refers to values that can be iterated over in a for/in loop
    // all objects can be iterated in a for loop and all arrays are objects too.
    IsEnumerable:   (value) => {return (typeof value === 'object' && value !== null) ;},
    // literal refers to values that are static literals. Strings, booleans, numbers, etc. Basically anything that isn't an object or array. flat values.
    IsLiteral:      (value) => {return ((typeof value !== 'object' && typeof value !== 'function') || value === null) ;},
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
    IsKeySafe:      (value) => {return (typeof value === 'string' && value !== '') ;},
    // emptystring refers to values that are string literals with no contents
    IsEmptyString:  (value) => {return value === '' ;},
    // hasvalue refers to values that are defined and notemptystring. specifically this includes 0 and negative numbers where truey does not.
    HasValue:       (value) => {return ((typeof value !== 'undefined' && value !== null) && value !== '') ;},
    // anything refers to values of any type. it is specifically useful when SeeIf is being used as a filtering library.
    IsAnything:     (value) => {return true ;},
    
    IsStringAndHasValue: (value)=>{return (typeof value === 'string' && value !== '') ;},
    
    IsOnlyNumbers:  (value) => {return (/^-?\d*\.?\d+$/.test(value));},
    
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
  Object.assign(SeeIf, {
    NotDefined:SeeIf.IsUndefined,
    NotNullish:SeeIf.IsDefined,
    NotFalsey:SeeIf.IsTruey,
    NotTruey:SeeIf.IsFalsey,
    IsSet:SeeIf.IsDefined,
    NotSet:SeeIf.IsUndefined,
  });
  
}, 'SeeIf');

OnLoad('/doh_js/setter', function($){
  let Setter = window.Setter || {};
  Object.assign(Setter, {
    /**
     *  @brief call a callback any time a property on an object changes
     *  
     *  @param [in] object             [object] the object to watch
     *  @param [in] prop               [string] the property name to watch
     *  @param [in] on_change_callback [function] the callback to fire when the value of prop changes
     *  @return a function that clears the observing
     *  
     *  @details on_change_callback(object, prop, new_value){this === object;}
     */
    observe: function(object, prop, on_change_callback){
      let prop_desc;
      // we can only set this system up on objectobjects     not triple equal on purpose
      if(toString.call(object) == '[object Object]'){
        // for now, the only valid prop indicator is a string
        // observe requires a function for callback or the observation isn't seen
        if(typeof prop === 'string')if(typeof on_change_callback === 'function'){
          // check for a setter already there
          let old_setter, new_setter;
          prop_desc = Object.getOwnPropertyDescriptor(object, prop);
          if(!prop_desc) {
            let proto = Object.getPrototypeOf(object);
            prop_desc = Object.getOwnPropertyDescriptor(proto, prop);
            //console.warn('getOwnPropertyDescriptor fail for',object,prop);
          }
          let has_setter = typeof prop_desc.set == 'function'
          if(!has_setter || (has_setter && !prop_desc.set.meld_stack)) {

            if(has_setter && !prop_desc.set.meld_stack){
              old_setter = prop_desc.set;
              new_setter = function(obj,prop,val){
                old_setter.apply(obj,[val]);
              }
            }
            // bind the original value to a new local variable
            // IMPORTANT: this 'let val ...' statement creates a closure around 'val' and essentially
            //           turns it into the actual value storage for this property. The getter gets this
            //           internal val, and the setter sets it. This allows the property to both store it's own value
            //           as well as have both getter and setter for access and retrieval.
            let val = object[prop],


            // create a local closure for the method stack as well
            method_stack = [],
            // and the melded method that we will assign to the setter
            melded_method = function(new_value){
              // use the original value storage as intended, even though these closures are all that can see it
              if(val !== new_value){
                // set the value to the new value
                // we have to set the val first BEFORE calling the stack or we will recurse on ourself forever
                val = new_value;
                // this melder always does the same thing:
                //  walk the method stack and apply each method to the bound object
                let len = method_stack.length;
                for(let i=0;i<len;i++){
                  method_stack[i].apply(object, [object, prop, new_value]);
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
              // if we have a setter, then we must have a getter
              // our fancy getter retrieves the original value storage, which
              // is the thing that gets updated.
              get: function(){return val;},
              set: melded_method,
              // don't break enumerable stuff
              enumerable: prop_desc.enumerable,
              // don't break our ability to configure
              configurable: true,
            });
          }
          // we have to get (or re-get) the prop_desc here in case the melded setter already exists or we just made one
          prop_desc = Object.getOwnPropertyDescriptor(object, prop);

          if(!prop_desc) {
            let proto = Object.getPrototypeOf(object);
            prop_desc = Object.getOwnPropertyDescriptor(proto, prop);
          }
          if(new_setter){
            prop_desc.set.meld_stack.push(new_setter);
          }
          if(!prop_desc.set.meld_stack){
            console.warn('Setter.observe found a different kind of setter for:',prop,'on object:',object,'with callback:',on_change_callback);
            return function(){};
          }
          // just push our on_change onto the meld_stack. 
          prop_desc.set.meld_stack.push(on_change_callback);
          // return a function that can be called to remove the on_change callback
          return function(){
            prop_desc.set.remove_melded(on_change_callback);
          }
        }
      }
    },
    /**
     *  @brief tell two things to have a property mimic the other
     *  
     *  @param [in] my_thing           [object] the object the callback is relative to
     *  @param [in] my_prop            [string] name of the prop on my_thing to sync
     *  @param [in] their_thing        [object] the object to sync with
     *  @param [in] their_prop         [string] name of the prop on their_thing to sync with
     *  @param [in] on_change_callback [function] optionally a function to run when my_thing[my_prop] is changed
     *  @return a function that will remove the mimic that was just created when called
     *  
     *  @details shockingly simple
     *  
     *    on_change_callback(my_thing, my_prop, their_thing, their_prop, new_value){this === my_thing;}
     */
    mimic: function(my_thing, my_prop, their_thing, their_prop, on_change_callback){
      
      // syncing demands initial state to be synced BEFORE setters are defined
      // IMPORTANT: this keeps the initial set from echoing forever
      if(my_thing[my_prop] !== their_thing[their_prop]) my_thing[my_prop] = their_thing[their_prop];
      
      // make a setter for our value that will call the on_change_callback when we change
      let my_set = function(object, prop, new_value){
        // i only get run if my value changed
        // only make their setter system run when actually needed
        if(their_thing[their_prop] !== new_value) their_thing[their_prop] = new_value;
        // unlike Setter.observe(), .mimic() does something with the observed value, so the change callback isn't mandatory since it's being wrapped anyway.
        if(on_change_callback) on_change_callback.apply(my_thing, [my_thing, my_prop, their_thing, their_prop, new_value]);
      },
      // make a setter for their value that will set me if needed, triggering my own observers 
      their_set = function(object, prop, new_value){
        // i get run if THEIR value changed, we still have to check
        // if the new value is actually new to us too.
        if(new_value !== my_thing[my_prop]){
          // if it IS new to us, then setting it will trigger the setters
          my_thing[my_prop] = new_value;
        }
      },
      my_remover = Setter.observe(my_thing, my_prop, my_set),
      their_remover = Setter.observe(their_thing, their_prop, their_set);
      // return a function that can be called to remove both callbacks
      return function(){
        my_remover();
        their_remover();
      };
    },
  });
  
  Object.assign(Doh, Setter);
    
}, 'Setter');

OnLoad('/doh_js/core', function($){
  
  // if included, we remove SeeIf. It should not be added to
  if(window?.DohWatch)if(DohWatch.SeeIf){
    delete DohWatch.SeeIf;
  }
  // build the core!
  Doh.meld_objects(Doh, {
    // in nodejs, the normal OnLoad is replaced with a far simpler one that needs this set for core.
    ModuleCurrentlyRunning: '/doh_js/core',
    // this remains to be updated, Doh still hasn't really grasped versioning
    Version:'2.0.4a',
    // allow storage of patterns
    Patterns: {},
    // keyed by pattern, the name of the module that made it (or false if made after load)
    PatternModule: {},
    // keyed by pattern, a list of things that inherit from it
    PatternInheritedBy: {},
    // keyed by module, a list of patterns it creates
    ModulePatterns: {},
    HasReported: {},
    /**
     *  a collection of functions to validate compatibility of a melded property
     *  with it's contents
     */
    MeldedTypeMatch: {
      'method':           SeeIf.IsFunction,
        'phase':            SeeIf.IsFunction,
      'object':           SeeIf.IsObjectObject,
        'idea':             SeeIf.IsObjectObject,
      'array':            SeeIf.IsArray,
      'static':           SeeIf.IsDefined,
      'exclusive':        SeeIf.IsAnything,
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
     *    Doh.type_of(New('object',{}))
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
    /**
     *  @brief produce a list of all SeeIf results for value
     *  
     *  @param [in] value [any] thing to test
     *  @return a separated list of types this value is and (is) not
     *  
     *  @details Return {is:[array of types this value is], not:[array of types this values is not]}
     */
    type_list: function(value){
      let rtn_true = {}, rtn_false = {}, result;
      for(let seeif_name in SeeIf){
        result = SeeIf[seeif_name](value);
        if(result){
          rtn_true[seeif_name] = result;
        }
        else rtn_false[seeif_name] = result;
      }
      //console.log(value,'is the following types:\n',rtn);
      return {is:rtn_true, not:rtn_false};
    },

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
     *  console.log('error message', object1, 'some string', objectN, ...);
     */
    log: console.log.bind(console, ''),
    /*
    log: function(){
      Doh._log(arguments, 'Doh:', 'trace');
    },*/
    /**
     *  @brief log a custom warning to Doh
     *
     *  @param [in] context, context, ...   object(s) of relevence to the warning
     *  @return nothing
     *
     *  @details
     *  Doh.warn('error message', object1, 'some string', objectN, ...);
     */
    warn: console.warn.bind(console, 'Warning:'),
    /*
    warn: function(){
      Doh._log(arguments, 'Doh Warning:', 'warn');
    },*/
    /**
     *  @brief log a custom error to Doh
     *
     *  @param [in] context, context, ...   object(s) of relevence to the error
     *  @return nothing
     *
     *  @details
     *  Doh.error('error message', object1, 'some string', objectN, ...);
     */
    error: console.error.bind(console, 'ERROR:'),
    /*
    error: function(){
      Doh._log(arguments, 'Doh ERROR:', 'error');
    },*/
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
    debug: (Doh.DebugMode?function(){throw console.error('ERROR:', ...arguments);}:console.error.bind(console, 'DEBUG:')),
    /*
    debug: function(){
      if(Doh.DebugMode) throw Doh._log(arguments, 'Doh DEBUG:', 'error');
      Doh._log(arguments, 'Doh DEBUG:', 'error');
    },*/
    /**
     *  @brief throw and log an error to Doh
     *
     *  @param [in] context, context, ...   object(s) of relevence to the error
     *  @return nothing
     *
     *  @details 
     *  
     *  Doh.throw('error message', object1, 'some string', objectN, ...);
     */
    throw: function(){
      throw Doh._log(arguments, 'THROW:', 'error');
    },

    /**
     *  @brief return true if item is in array
     *  
     *  @param [in] item  [any] thing to search for
     *  @param [in] array [array] to search
     *  @return true if item is in array
     *  
     *  @details Used by Doh.meld_arrays to filter arrays of duplicates
     */
    in_array: function( item, array ) {
      
      if ( typeof array === 'undefined') return -1;
      
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
     *  @brief similar to meld_arrays but always melds onto a new array.
     *  
     *  @param [in] ...arguments arrays or values that will be flattened into a new array
     *  @return new melded array
     *  
     *  @details specifically differs from regular meld_arrays because it doesn't modify either argument
     */
    meld_into_array: function(){
      /* This single line is very potent, let's break it down:
      // Set is unique by default, it is also order-of-insertion.
      // arguments isn't a real array, it's a gimped one with no methods, so we have to use Array.prototype to get .flat()
      // flat() takes an array of arrays or values and flattens into a single array of all the values in each nest.
      // ... spread operator on a Set will spread it into an array or object (the outer array brackets, in our case)
      // Soooo... flatten all the arguments into a single array, then use Set to make it unique, starting with order-inserted
      //   then spread all remaining values into a new array.
      */
      return [...new Set([].flat.call(arguments, 1))];
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
     *  {'pattern_name_1':true, 'pattern_name_2':true}
     *  {'pattern_name_1':true, 'pattern_name_2':'other truey value'}
     *  
     *  *RESULTS IN:* {'pattern_name_1':true, 'pattern_name_2':'other truey value'}
     *  *OR* at least:{} if nothing valid is sent in
     **/
    meld_into_objectobject: function(){
      // always land in a new object
      let object = {};
      // call the array prototype method forEach to iterate arguments
      [].forEach.call(arguments, arg => {
        // use strings to set keys to true
        if(typeof arg === 'string') return object[arg] = true;
        // use arrays to set lists of keys to true
        if(Array.isArray(arg)) return arg.forEach(subkey => {object[subkey] = true;});
        // just meld in any objects we pass that aren't arrays handled above.
        if(typeof arg === 'object') return Object.assign(object, arg);
      });
      
      return object;
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
      let meld_method_order = [], 
          pre_meld_method_order = [], 
          inherited_patterns = object.inherited, 
          inherited_pattern;
      
      for(let i in inherited_patterns){
        inherited_pattern = inherited_patterns[i];
        if(inherited_pattern['pre_'+method_name]) pre_meld_method_order.push(inherited_pattern['pre_'+method_name]);
        if(inherited_pattern[method_name]) meld_method_order.push(inherited_pattern[method_name]);
      }
      return pre_meld_method_order.concat(meld_method_order);
    },
    /**
     *  @brief return a closure for object[method_name] that will call each function in method_stack
     *  
     *  @param [in] object       [any] thing to use as 'this'
     *  @param [in] method_stack [array] of functions to run as this method OR
     *                           [string] of method name to use for collecting methods from .inherited
     *  @return a closure function that will call each function in method_stack
     *  
     *  @details object[method_name].update_meld_stack() will automatically recalculate
     *           melds based on current .inherited
     *           object[method_name].meld_stack is the actual meld_stack array that can be manipulated to affect the next run of method
     */
    meld_method: function(object, method_stack = []){
      // if the stack is a string, then we are trying to meld a method from object.inherited
      let method_name = false;
      if(typeof method_stack === 'string'){
        method_name = method_stack;
        method_stack = Doh.find_meld_method_stack(object, method_name);
      }
      let melded_method = function(){
        // this melder always does the same thing:
        //  walk the method stack and apply each method to the bound object
        let i, len = method_stack.length;
        for(i=0;i<len;i++){
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
     *  @brief Update ALL meld_methods and phases of object
     *  
     *  @param [in] object [object] to look for melded methods on
     *  @return nothing
     *  
     *  @details operates on object, replaces melded method keys with actual method melders
     */
    update_meld_methods: function(object, deep_melded, builder){
      let melded_prop = '', inner_melded = object.melded, melded_value;
      if(deep_melded) inner_melded = deep_melded;
      for(melded_prop in inner_melded){
        melded_value = inner_melded[melded_prop];
        // if the melded_value
        // look for melded methods and phases on object
        if(inner_melded[melded_prop] === 'method' || inner_melded[melded_prop] === 'phase'){
          // conditionally update only the method stack if the method was melded before
          if(typeof object[melded_prop] === 'function')if(typeof object[melded_prop].update_meld_stack === 'function'){
            object[melded_prop].update_meld_stack();
            continue;
          }
          // otherwise, do a fresh meld
          object[melded_prop] = Doh.meld_method(object, melded_prop);
          continue;
        }
        //if(object.melded
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
    // the most important function in Doh:
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
     *  
     *    Doh.meld_ideas({},{}) == {};
     *                  ({},{prop:'myprop'}) == {prop:'myprop'}
     *                  ({prop:'oldval'},{prop:'myprop'}) == {prop:'myprop'}
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
            destination_melded_type = destination.melded[prop_name];
            if(SeeIf.IsSet(destination_melded_type))if(SeeIf.NotString(destination_melded_type)) destination_melded_type = 'object';
            // deal with destination defines a meld type that is different from idea
            if(destination_melded_type){
              if(destination_melded_type != idea_melded_type){
                Doh.debug('Doh.meld_ideas(',destination,',',idea,'). destination.melded[',prop_name,']:',destination.melded[prop_name],'will be overwritten by idea.melded[',prop_name,']:',idea_melded_type);
              }
              if(idea_melded_type === 'exclusive' || idea_melded_type === 'static'){
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
        if(!melded_type)if(melded['*']) melded_type = melded['*'];
        if(SeeIf.IsSet(melded_type))if(SeeIf.NotString(melded_type)){
          go_deep = true;
          melded_type = 'object';
        } else go_deep = false;
        idea_prop = idea[prop_name];
        if(idea_prop !== undefined && idea_prop !== destination[prop_name]){
          if(melded_type === 'method' || melded_type === 'phase' || melded_type === 'exclusive' || melded_type === 'static'){
            // melded methods and phases will be updated outside of meld. our job is just to copy idea onto destination.
            // exclusive properties only come from first idea that claims it, this 'ownership' is resolved with thrown errors above, so we always copy.
            destination[prop_name] = idea_prop;
            continue;
          }
          if(melded_type === 'object' || (typeof idea_prop === 'object' && !Array.isArray(idea_prop) && SeeIf.IsEmptyObject(idea_prop) && SeeIf.NotNull(idea_prop))){
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
          if(SeeIf.NotNull(idea_prop))if(idea_prop.pattern)if(!idea_prop.machine)if(!idea_prop.skip_being_built){
            // it's an auto-build property, auto-meld it below
            //destination.melded[prop_name] = 
            melded[prop_name] = 'idea';
            if(destination.melded)if(destination.melded[prop_name] !== melded[prop_name]){
              destination.melded[prop_name] = melded[prop_name];
            }
            // CONTROVERSIAL: modify the melded set passed in?
            // so far this is the only way to allow special melded collections to contain auto-built properties
            if(inner_melded) inner_melded[prop_name] = melded[prop_name];
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
     *  @details special_meld_ideas(special_melded, dest, idea1, idea2, idea3, ...)
     */
    special_meld_ideas: function(special_melded, destination){
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
      
      // allow doh to watch the pattern name and replace it if needed
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
      // ApplyFixes tells us to look at pattern creation
      if(Doh.ApplyFixes){
        // just generates a bunch of warns and stuff with a few possible fixes. Should not be used in production.
        Doh.look_at_pattern_keys(idea);
      }
      // return the new pattern
      return idea;
    },
    /**
     *  @brief Mix a pattern from Patterns into destination
     *  
     *  @param [in] destination [object] the object to copy onto
     *  @param [in] pattern     [string] the name of a pattern to mixin
     *  @return destination
     *  
     *  @details This is used by the builder to a mix a pattern into a new instance of an object.
     *           NOTE: will also update_meld_methods for destination ONLY IF it is already a built DohObject
     *           NOTE: mixin_pattern will not inherit a pattern onto the same object twice.
     *           NOTE: mixin_pattern will properly meld the pattern onto destination, update .inherited,
     *                 and update all melded methods, BUT it will not run or re-run any phases.
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
            /*
            // before we update methods, lets find out about phases that have run
            let type;
            for(let prop_name in destination.melded){
              type = destination.melded[prop_name];
              if(type === 'phase'){
                // meld_ideas validates melded types so we don't have to.
                if(destination.inherited[pattern][prop_name]){
                  // the newly inherited pattern has a phase
                  if(destination.machine.completed[prop_name]){
                    // the machine has already run this phase
                    // NOTE: late mixins will ignore pre_ methods on phases that have already run
                    destination.inherited[pattern][prop_name].apply(this);
                  }
                  // otherwise, now that we are mixed in, we will participate in phases
                }
              }
            }
            */
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
    /**
     *  @brief Return a collection of all ancestor dependencies for [inherits]
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
          //console.log(Doh.PatternModule[pattern_name],'spawns',pattern_name,'from',inherits);
          if(pattern_name !== 'idea')if(Doh.PatternModule[pattern_name].indexOf('/doh_js/') == 0){
            //console.log('Doh.extend_inherits() is skipping core and found a core pattern:', pattern_name, 'from module:', Doh.PatternModule[pattern_name]);
            // this is a core module because the string starts with /doh_js/
            //inherits[pattern_name] = null;
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
      // use const to keep the class from ever being 'new' again
      const DohObject = function(){};
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
     *  
     *   New([DohObject], [string]); [e.g: New(DohObject, **'phase');]       sending an already built object through New will move it through the phases
     *                                                                       to 'phase' or **'final' if none is specified.
     *  
     *   New([object]);              [e.g: New(idea);]                       requires the idea to define .pattern, machine to 'final' phase.
     *  
     *   New([string], [object]);    [e.g: New('pat', idea);]                create a DohObject from 'somepattern' then meld idea to it, machine to 'final' phase.
     *  
     *   New([array], [object]);     [e.g: New(['pat1', 'pat2'], idea);]     add 'pattern1' then 'pattern2' to .inherits and set .pattern to 'idea' before creating object
     *                                                                       and machine to final phase.
     *  
     *   New(..., [string]);         [e.g: New('pat', idea, 'aphase');]      basically, if the last argument is a string then it will be the phase we are supposed to machine to.
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
        
      // this comes before melding the idea so we can catch watched keys on the way in to apply fixes consistently
      if(Doh.ApplyFixes)
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
         * thing.watch( 'a_property', 'set', 37,             function(target,prop,value){console.log('hey,',prop,'on',target,'set to:',value,';')} )
         *
         * call the callback provided if a_property is exactly 37 when retrieved
         * thing.watch( 'a_property', 'get', 37,             function(target,prop,receiver){console.log('hey, got',prop,'=',target[prop],'; on',target)} )
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
                    //if(!Doh.SeenPhases[watched_phase][object.pattern]) Doh.warn('Watched Phase:',watched_phase,'will run:',command_value,object);
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
      
      // now we can add the debug handlers, since the object is finished being constructed and is ready to go through phases
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

    /**
     *  @brief Turn a dot delimited name into a deep reference on 'object'
     *
     *  @param [in] object        The object to get a deep reference to
     *                            Pass true to 'object' and it will return the last key of the split
     *                            Pass false to 'object' to return the split array
     *  @param [in] property_str  A dot-delimited string of the nested property on object
     *  @param [in] count_back    return a reference count_back from the end of the property_str names array
     *  @return A deep reference into 'object' or the last key of the split or the whole split array
     *  
     *  @details Also used by /utils/ajax
     *  
     *            Can also handle arrays in the nested flow. (e.g.: myproperty.subprop.subarray.3.property_of_object_on_an_array.etc
     *                                                     becomes: myproperty.subprop.subarray[3].property_of_object_on_an_array.etc)
     */
    parse_reference: function(object, property_str, count_back = 0){
      let current_reference = object, current_prop,
      property_names_array = new String(property_str).split('.');
      // pass true to 'object' and it will return the last key of the split
      if(object===true) return property_names_array[property_names_array.length-1];
      // pass false to 'object' and it will return the split array
      if(object===false) return property_names_array;
      // otherwise, use the array to try and walk the reference nesting
      let num_props = property_names_array.length+count_back;
      for(let i=0; i < num_props; i++){
        current_prop = property_names_array[i];
        if(SeeIf.IsUndefined(current_reference[current_prop])){
          Doh.debug('Doh.parse_reference(',object,',',property_str,"couldn't find: '",current_prop,"' on the object:",current_reference);
        }
        current_reference = current_reference[current_prop];
    
        if(SeeIf.IsUndefined(current_reference)){
          // is it an array? if so, the key could be a number
          if(SeeIf.IsNumber(Number(current_prop)))
            current_reference = current_reference[Number(current_prop)]
        }
      }

      return current_reference;
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
      // track when we see phases so we can mute flooding the console
      Doh.SeenKeys = Doh.SeenKeys || {};
      for(pattern_prop in Doh.WatchedKeys){
        idea_prop = '';
        for(idea_prop in idea){
          if(idea_prop === pattern_prop){
            // note that we have seen a phase ever on any object
            Doh.SeenKeys[pattern_prop] = Doh.SeenKeys[pattern_prop] || {};
            // this idea_prop is being watched, log it and run the list of commands to try and fix it
            command = '';
            command_value = '';
            for(command in Doh.WatchedKeys[pattern_prop]){
              command_value = Doh.WatchedKeys[pattern_prop][command];
              switch(command){
                case 'log':
                case 'warn':
                case 'error':
                case 'throw':
                  if(!Doh.SeenKeys[pattern_prop][idea.pattern]) Doh[command]('WatchedKeys:',pattern_prop,'wants to',command,':',command_value,(idea.idealize?idea.idealize():idea));
                  break;
                case 'run':
                  //if(!Doh.SeenKeys[pattern_prop][idea.pattern]) Doh[logger_method]('WatchedKeys:',pattern_prop,'will run a custom command');
                  command_value(idea);
                  break;
                case 'rename':
                  if(!Doh.SeenKeys[pattern_prop][idea.pattern]) Doh[logger_method]('WatchedKeys:',pattern_prop,'has been renamed:',command_value,(idea.idealize?idea.idealize():idea));
                  if(idea.melded?.[pattern_prop]){
                    idea.melded[command_value] = idea.melded[pattern_prop];
                    //idea.melded[pattern_prop] = null;
                    delete idea.melded[pattern_prop];
                  }
                  // make our new reference to the contents
                  idea[command_value] = idea[pattern_prop];
                  break;
                case 'remove':
                  if(!Doh.SeenKeys[pattern_prop][idea.pattern]) Doh[logger_method]('WatchedKeys:',pattern_prop,'will be removed.',(idea.idealize?idea.idealize():idea));
                  if(idea.melded?.[pattern_prop]){
                    //idea.melded[pattern_prop] = null;
                    delete idea.melded[pattern_prop];
                  }
                  //idea[pattern_prop] = null;
                  delete idea[pattern_prop];
                  break;
              }
            }
            // now that we've run all the commands once, we have "seen" it, so we don't need to blast the console
            /// notify once per pattern that we have encountered watched phases
            Doh.SeenKeys[pattern_prop][idea.pattern] = true;
            // we found the thing we were looking for, just bail to the next pattern_prop
            break;
          }
        }
      }
      return idea;
    },
    /**
     *  @brief inspect and alter a passed-in pattern name
     *  
     *  @param [in] pattern_name [string] a pattern name to inspect
     *  @return nothing
     *  
     *  @details Used by Doh.pattern and Doh.New to watch for changed or deprecated pattern names
     */
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
                //Doh[logger_method]('WatchedPatternNames:',pattern_name,'will run:',command_value);
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
    
    collect_buildable_ideas: function(object, melded, builder, parsable_reference_from_builder){
      let this_prop;
      // find properties of an object that could be built
      for(let prop_name in object) {
        if(prop_name === 'prototype' || prop_name === '__proto__') continue; // sometimes these pop up. iterating 'this' is dangerous for some reason
        this_prop = object[prop_name];
        // Check for properties that are themselves ideas waiting to be built
        // nest the if's for speed
        // it has to exist, have .pattern, not have .machine and not have .skip_being_built.
        // check existance, check for pattern, check for if we have been built already, check for wanting to be ignored
        if(SeeIf.IsObjectObject(melded[prop_name])){
          // this is a special melded object, we need the collector to recurse one more time
          Doh.collect_buildable_ideas(this_prop, melded[prop_name], builder, parsable_reference_from_builder?parsable_reference_from_builder+'.'+prop_name:prop_name);
        } else {
          if(this_prop)if(this_prop.pattern)if(this_prop.pattern !== 'idea')if(!this_prop.machine)if(!this_prop.skip_being_built){
            // only things that are builders should have this
            builder.built = builder.built || {};
            builder.machine_built_to = builder.machine_built_to || 'builder_phase';
            // tell the thing that we are auto building it. this allows the thing to react to being built if needed
            this_prop.builder = builder;
            // tell the thing how to reference itself from it's builder (thing.builder[thing.my_property_on_builder] === thing)
            //this_prop.my_property_on_builder = prop_name;
            this_prop.my_property_on_builder = parsable_reference_from_builder?parsable_reference_from_builder+'.'+prop_name:prop_name;
            // for instance, auto_building only runs to object phase. if further or 'final' phase is desired, run .machine_built(phase)
            // don't build just yet, we need to control nesting so we don't hit max execution depth
            // object[prop_name] = New(this_prop, builder.machine_built_to);
            // add our name to built. this is used to know which properties are sub-objects
            builder.built[parsable_reference_from_builder?parsable_reference_from_builder+'.'+prop_name:prop_name] = object[prop_name];
          }
        }
      }
    },
  });
  /* **** Doh Object Ready **** */
  window.Patterns = Doh.Patterns;
  window.Pattern = Doh.pattern;
  window.New = Doh.New;
  /**
   *  @brief determine if an object has had a pattern mixed into it
   *  
   *  @param [in] object    [object] to search pattern inheritence
   *  @param [in] pattern   [string] name of pattern to search for
   *  @return true if object inherited pattern, otherwise false
   *  
   *  @details 

   */
  window.InstanceOf = Doh.InstanceOf = function(object, pattern){
    pattern = pattern || 'object';
    if(object)if(object.inherited)if(object.inherited[pattern]) return true;
    return false;
  }

  /**
   *  The 'idea' pattern is a special ephemeral pattern that is used when filtering object.inherited.
   *  This empty pattern allows the final, anonymous idea sent into New() to be called 'idea' and added to object.inherited.
   *  Then, later, when validation or type checking are used to understand the final idea, it validates as a Pattern.
   *  This subsequently makes it possible to reference the final idea by it's pattern name of 'idea' in object.inherited, knowing
   *    that the pattern is not techincally a pattern, any mmore than a pattern is not techincally an idea. 
   *  
   *  In other words:
   *  
   *  - Patterns are really just validated ideas with a specific name in the Patterns collection (namespace).
   *  
   *  - An idea is just an anonymous pattern.
   *  
   *  - So the "idea" pattern is just an empty placeholder for the anonymous pattern that will be sent in at the last minute.
   *  
   *  NOTE: DO NOT INHERIT THIS PATTERN
   */
  Pattern('idea');
  /**
   *  set the prototype for the object constructor
   */
  Pattern('object', {
    // define the melded types of all objects of Doh
    melded:{
      // always meld this collection so our patterns can extend this
      melded:'object',
      // mark object_phase as a phase
      object_phase:'phase',
      builder_phase:'phase',
      // mark idealize and perspective as exclusive
      // this will indicate that we want the builder to ignore anyone setting it except us
      idealize:'exclusive',
      perspective:'exclusive',
    },
    // ensure that we are the base object phase
    object_phase: function() {
      // object phase needs a final chance to loop over it's properties before everyone gets to go
      for(let prop_name in this.melded) {
        // check for static properties and connect them to their respective pattern statics
        if(this.melded[prop_name] === 'static'){
          // someone wanted us to eventually sync with a pattern static
          for(let pattern in this.inherited){
            if(pattern === 'idea'){
              Doh.debug("You can't set static in an idea. Nothing else will follow it.");
              continue;
            }
            // this only works if the value is not undefined
            if(SeeIf.IsSet(this.inherited[pattern][prop_name])){
              // make me mimic the pattern static
              Doh.mimic(this, prop_name, this.inherited[pattern], prop_name);
              // no need to carry on, there can only be one pattern to claim a static or exclusive
              break;
            }
          }
        }
      }
    },

    builder_phase: function() {
      
      // iterate over this, using this.melded as the melded, assign this as the builder, blank reference from builder because
      // the first layer is directly attached to builder
      //                          obj,  melded,      builder, parsable_reference_from_builder
      Doh.collect_buildable_ideas(this, this.melded, this,    '');
      
      // we built stuff, now we need to be able to support it:
      // if we are in a built-chain, we need these
      if(this.built || this.builder){
        this.builder_method = function(method_name) {
          let bld = this.builder;
          while(bld) {
            if(SeeIf.IsFunction(bld[method_name]))
              return bld[method_name].bind(bld);
            bld = bld.builder;
          }
          return function(){Doh.warn('no builder method:',method_name)};
        };
        this.builder_property = function(prop_name) {
          let bld = this.builder;
          while(bld) {
            if(SeeIf.IsDefined(bld[prop_name]))
              return bld[prop_name];
            bld = bld.builder;
          }
          return function(){Doh.warn('no builder property:',prop_name)};
        };
      }
      
      // now do the actual building
      if(this.built){
        // me as a builder phase
        this.machine_built = function(phase){
          // loop through the built and attempt to machine them
          let deep_this, deep_prop_name;
          for(let prop_name in this.built) {
            if(prop_name === 'length') continue;
            //this.built[prop_name].machine(phase);
            if(SeeIf.NotUndefined(this[prop_name])){
              this[prop_name] = this.built[prop_name] = New(this[prop_name], phase);
            } else if(prop_name.indexOf('.') !== -1){
              // parse ref
              //                              obj,  deep ref,  count_back from the last reference
              deep_this = Doh.parse_reference(this, prop_name, -1);
                                                // true to get back the last reference in prop_name
              deep_prop_name = Doh.parse_reference(true, prop_name);
              // the above lets us alter the deep reference to our newly built/machined value
              deep_this[deep_prop_name] = this.built[prop_name] = New(this.built[prop_name], phase);
            } else {
              this.built[prop_name] = New(this.built[prop_name], phase);
            }
          }
        };
        this.machine_built(this.machine_built_to);
      }
      
      if(Doh.ApplyFixes){
        this.machine.completed.parenting_phase = true;
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
    toIdea: function(inherits) {
      // try to turn this into an idea
      // compile the inherited ideas into a gimped default object
      let new_idea = {}, prop_name, prop;
      
      inherits = Doh.meld_into_objectobject(inherits || this.inherited);
      for(let pattern_name in inherits){
        prop_name = '';
        for(prop_name in this.inherited[pattern_name]){
          prop = this.inherited[pattern_name][prop_name];
          
        }
      }
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
      
      console.log('Doh.perspective() was sent patterns:',patterns,'and methods:',methods);
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
      console.log('Doh.perspective() is using',patterns,'to extend inherits.');
      // default to expanding the pattern, but skip core patterns, cause we never need those
      patterns = Object.keys(Doh.extend_inherits(patterns, true));
      console.log('Doh.perspective() found:',patterns);
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
    // list of child objects to build
    children: [],
    // extend the children array
    melded:{
      children: 'array',
    },
    object_phase:function(){
      this.builder = this.builder || 'body';
      
      // we are basically deprecating parent by doing this.
      this.parent = this.builder;
      //Doh.mimic(this, 'parent', this, 'builder');
      Doh.mimic(this, 'builder', this, 'parent', function(){
        // this means that someone set parent, and it changes builder
        if(!Doh.ReduceWarnings || !Doh.HasReported['parent']) Doh.warn('.parent is deprecated, please use builder instead', this.idealize());
        Doh.HasReported['parent'] = true;
      });
    },
    pre_builder_phase: function(){
      // loop through the children and add them to the builder
      var i = '', child = false, prop_name = false;
      for(i in this.children) {
        if(i === 'length') continue;
        this.built = this.built || {};
        child = this.children[i];
        // make ourself the builder
        this.built['children.'+i] = Doh.meld_objects(child, {builder:this});
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
      for(let prop_name in old_melded){
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
  rename_wrapper('log_melded_method', 'console.log_melded_method_string', console.log_melded_method_string);
  rename_wrapper('link_melded_method', 'console.log_melded_method_source', console.log_melded_method_source);
  
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
  // testing out some interesting filter functionallity
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
    built:true,
    builder:true,
    my_property_on_builder:true,
    machine_built:true,
    machine_built_to:true,
    // may be added by debug mode during New
    watch:true,
  });
  
  /**
   *  A place to house things that we no longer want in core, but don't yet have another home
   */
  Doh.meld_objects(Doh, {
    // USED BY: /utils/node (node is horribly named)
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

    // USED BY: doh inspector?
    /**
     *  @brief return the execution order of a melded method by name on an object
     *  
     *  @param [in] object [object] a DohObject to inspect
     *  @param [in] method [string] name of method to expose
     *  @return an array of 'inherited_pattern.pre_method/method' for each pattern that implements this method name
     *  
     *  @details [examples?]
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
     *  @brief return the execution order of all phases on an object
     *  
     *  @param [in] object [object] a DohObject to inspect
     *  @return an array of 'inherited_pattern.pre_method/method' for each pattern that implements each phase
     *  
     *  @details [examples?]
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
     *  @brief return the execution order of all melded methods and phases on an object
     *  
     *  @param [in] object [object] a DohObject to inspect
     *  @return an array of 'inherited_pattern.pre_method/method' for each pattern that implements this method or phase
     *  
     *  @details [examples?]
     */
    get_all_melded_method_order: function(object){
      var methods_order = [], counter = 0, phase_methods = 0;
      for(var melded_prop in object.melded){
        if(object.melded[melded_prop] === 'method' || object.melded[melded_prop] === 'phase'){
          methods_order.push(Doh.get_melded_method_order(object, melded_prop));
          counter += methods_order[methods_order.length-1].length
        }
      }
      return methods_order;
    },
    /**
     *  @brief send the stringified code of a melded method to the Doh log
     *  
     *  @param [in] object [object] a DohObject to inspect
     *  @param [in] method [string] the name of a method to look for
     *  @return nothing
     *  
     *  @details This method is only meant for debugging, is it needed in core?
     */
    log_melded_method_string: function(object, method){
      var method_array = Doh.get_melded_method_order(object, method);
      for (i in method_array){
        console.log(method_array[i],object.inherited[method_array[i].split('.')[0]][method].toString());
      }
    },
    /**
     *  @brief send a clickable list of the melded methods to the Doh log
     *  
     *  @param [in] object [object] a DohObject to inspect
     *  @param [in] method [string] the name of a method to look for
     *  @return nothing
     *  
     *  @details This method is only meant for debugging, is it needed in core?
     */
    log_melded_method_source: function(object, method){
      var method_array = Doh.get_melded_method_order(object, method);
      for (i in method_array){
        console.log(method_array[i],object.inherited[method_array[i].split('.')[0]][method]);
      }
    },
    
    // USED BY: unsure? but i think these are used -CHRIS
    /**
     *  @brief 
     *  
     *  @param [in] idea Description for idea
     *  @param [in] args Description for args
     *  @return Return description
     *  
     *  @details args.exclude_methods, args.truncate_methods, args.exclude_children
     */
    idea_to_yaml: function(idea, args){
      var ic = this.idea_to_ideacode(idea, args);
      return jsyaml.load(ic);
    },
    /**
     *  @brief 
     *  
     *  @param [in] idea Description for idea
     *  @param [in] args Description for args
     *  @return Return description
     *  
     *  @details args.exclude_methods, args.truncate_methods, args.exclude_children
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
     *  @brief 
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
    /**
     *  @brief 
     *  
     *  @param [in] ideacode Description for ideacode
     *  @return Return description
     *  
     *  @details 
     */
    ideacode_to_source: function(ideacode){
      return 'New(' + ideacode + ');\n';
    },

    // AA: general utility?
    // USED BY: we don't really seem to use these anymore...
    array_move: function(array, from_index, to_index) {
      array.splice(to_index, 0, array.splice(from_index, 1)[0]);
      return array;
    },
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

// fix old parenting system
OnCoreLoaded(Doh.ApplyFixes, function(){
  Doh.meld_objects(Doh.WatchedKeys, {
    skip_auto_build:    {rename:'skip_being_built'},
    
    auto_built:         {rename:'built'},
    _auto_built_by:     {rename:'builder'},
    _auto_built_by_name:{rename:'my_property_on_builder'},
    
    machine_children:   {rename:'machine_built'},
    machine_children_to:{rename:'machine_built_to'},
    
    parent:             {rename:'builder'},
    
    parenting_phase:    {rename:'builder_phase'},
    pre_parenting_phase:{rename:'pre_builder_phase'},
    children:           {run:function(idea){
      if(!Doh.SeenKeys['children'][idea.pattern] && (!Doh.HasReported['children'] || !Doh.ReduceWarnings)) Doh.warn('"',idea.pattern,'" has children. (module:',Doh.PatternModule[idea.pattern],')');
      Doh.HasReported.children = true;
    }},
  });
  Doh.meld_objects(Doh.WatchedPhases, {
    parenting_phase:{rename:'builder_phase'},
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
    Doh.meld_objects(Doh.WatchedKeys, {
      attrs:    {rename:'attr'},
    });
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
            object = New({pattern:'element', e:object, builder:object.parent()}, 'builder_phase');
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
    if(object.builder){
      //if the parent is a controller, use that
      if(object.builder.is_controller) return object.builder;
      //otherwise, if the parent HAS a controller, use that
      if(object.builder.controller) return object.builder.controller;
      //otherwise, search for a controller
      return Doh.find_controller(object.builder);
    }
    // we have no parent, or we found no controller
    return false;
  }


  // AA:  A good place for an essay about the control system
  
  Pattern('control', 'object', {
    // advance the children machine to this phase when building
    machine_built_to: 'control_phase',
    // setup our phases for building controls
    melded:{
      control_phase:'phase'
    },
    control_phase: function(){
      if(!this.control)if(this.my_property_on_builder) this.control = this.my_property_on_builder;
      // if we have a control name
      if(this.control){
        // find the controller
        var controller = Doh.find_controller(this);
        // if we find one, use it
        if(controller){
          this.controller = controller;
        } else {
          // otherwise, use the parent with warning
          Doh.warn('control:', this, 'could not find a controller. Use the builder:', this.builder, 'instead.');
          this.controller = this.builder;
        }
        // ensure that our newly assigned controller has controls storage
        this.controller.controls = this.controller.controls || {};
        // add ourself to it
        this.controller.controls[this.control] = this;
      }
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
          // this is literally what jquery does too.
          newPattern.css[i] = newPattern.css[i]+'px';
          //Doh.warn('Pattern (' + newPattern.pattern + ')found css number for: ' + i + ' of: ' + newPattern.css[i] + ' .', 'The value may be ignored!' , newPattern);
        }
      }
      
      // get css, if any;
      Doh.meld_objects(newCSS, newPattern.css);
      
      // add our class to a stylesheet
      newPattern.stylesheet_class = $.stylesheet('#dynamic  {.'+className+'}');
      
      newPattern.stylesheet_class.css(newCSS);
      // add our class to the pattern's classes
      newPattern.classes = Doh.meld_arrays(newPattern.classes || [], [className]);
      // clear the properties so they aren't added to the final object
      newPattern.initial_css = newPattern.css;
      newPattern.css = {};
      if(newPattern.style){
        newPattern.initial_style = newPattern.style;
        newPattern.style = '';
      }
      
      newPattern.melded = Doh.meld_objects(newPattern.melded || {}, {
        initial_css: 'object'
      });
      
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
          if(DUC.attr.title){
            // ok, so something set our title, is it at least not empty string on the actual DDM object?
            if(SeeIf.IsEmptyString(DUC.e.attr('title'))){
              // so we wanted it to be set but it's empty on the DOM object, fix that:
              console.log('Tooltip title was set BUT it was deleted. Restored to the value originally set.', DUC.id, 'Pattern:', DUC.pattern, '.control:', DUC.control);
              DUC.e.attr('title', DUC.attr.title);
            }
          } else {
            // so we didn't set a title, but did a title get set by someone else?
            if(!DUC.e.attr('title')){
              // no title was set and it was never updated up to this point
              console.log('Tooltip title was not set AND it was never updated. Set to .control', DUC.id, 'Pattern:', DUC.pattern, '.control:', DUC.control);
              DUC.e.attr('title', DUC.control);
            } else {
              // a title was not defined by us, but someone updated us to have one, which somehow seems fine for now
              console.log('Tooltip title was not set BUT it was updated later. Abort.', DUC.id, 'Pattern:', DUC.pattern, '.control:', DUC.control);
            }
          }
        }
      }
      console.groupEnd();
    }
  }

  // AA:  A discussion of the interface between DOM elements and the html pattern should go here
  Pattern('html', ['parenting','control'], {
    melded:{
      // make classes unique during construction
      classes:'array',
      // NOTE: css passed in by patterns will be sent to the pattern class
      css:'object',
      attr:'object',
      html_phase:'phase'
    },
    // e should be a jQuery [Element/Array]
    // or false for using a passed in selector
    e: false,
    // attr will be deep copied so it is safe to send in to any element modifier
    // this will become an observer-compatible Proxy system for traping .attr mechanics
    // currently implemented are: apply, get, set, has, ownKeys, getOwnPropertyDescriptor, defineProperty
    attr: {},
    // used when e = false and we are generating a new element
    tag: 'div',
    // provided for selectors
    // will be mimicked to .attr.id
    id: '',
    // should always be a number keyed array of classes, will be uniqued.
    // will be replaced with an array-like Proxy that sync's with the live DOM
    // most array operations are supported except sorting and splicing/slicing.
    // can be looped over, iterated, called as a function to add...
    classes: ['doh'],
    // this will become a .observe system that watches the value change to update the dom
    // it will have an additional getter added to it that always retrieves the latest value from the dom
    //style: '',
    // a link to the stylesheet class from $.stylesheet that controls pattern style classes.
    // needs to be false, since this is not available to instances
    //stylesheet_class: false,
    // css will be deep copied so it is safe to send in to any element modifier
    // this will become an observer-compatible Proxy system for traping .css mechanics
    // currently implemented are: apply, get, set, has, ownKeys, getOwnPropertyDescriptor, defineProperty
    css: {},
    // html content to be added before appending children
    // this will become a .observe system that watches the value change to update the dom
    // it will have an additional getter added to it that always retrieves the latest value from the dom
    //html: '',
    
    
    object_phase:function(){
      let that = this;
      // ensure that the parent is a setting, already set,
      // or the body
      this.builder = this.builder || 'body';
      // convert to DohObject if we are a string selector
      if( typeof this.builder === 'string' ) {
        this.builder = Doh.get_dobj(this.builder);
      }
      // ensure that the element is a setting, already set, or a new jQuery element using this.tag
      this.e = this.e || $(document.createElement(this.tag));
      if( typeof this.e === 'string' ) {
        // if it's a string, then it's a jquery selector
        this.e = $(this.e);
      }
      
      // stash our dom object so we don't have to keep getting it over and over
      this.domobj = this.e[0];
      // stash ourself on the DOM object for the Doh.get_dobj() function later
      this.domobj.dobj = this;

      if(this.stylesheet_class) this.stylesheet_class = false;

          // patterns don't use css anymore, so this must be from the idea
      let idea_css = this.css,
          clist = that.domobj.classList,
          // create references for the proxies
          initial_classes = this.classes,
          initial_html = '',
          //initial_when = this.when || {},
          _classes = function(){},
          _css = function(){},
          _attr = function(){},
          _when = function(){};
      
      // store the css and attributes coming in from idea phase
      // css may already be there from the patterns converting css to classes
      if(SeeIf.NotEmptyObject(idea_css)){
        this.initial_css = Doh.meld_objects(this.initial_css || {}, idea_css);
      }
      // store the initial attr's set by the patterns and idea
      if(SeeIf.NotEmptyObject(this.attr)) {
        this.initial_attr = this.attr;
      }
      
      // make our new .classes property into a proxy that handles all our different use cases
      /**
       *  Classes can be added in the following ways:
       *    idea.classes[newClass1] = true;
       *    idea.classes[0] = newClass1;
       *    idea.classes(newClass1, newClass2, etc...);
       *    idea.classes.push(newClass1, newClass2, etc...);
       *    idea.classes.unshift(newClass1, newClass2, etc...);
       *  
       *  Classes can be checked in the following ways:
       *    if(newClass1 in idea.classes))
       *    if(idea.classes.indexOf(newClass1) > -1)
       *    if(idea.classes[newClass1] == true)
       *  
       *  Classes can be removed in the following ways:
       *    delete idea.classes[newClass1];
       *    delete idea.classes[0 (or index of class you want to delete)];
       */
      this.classes = new Proxy(_classes, {
        apply: function(target, thisArg, argumentsList){
          let classname;
          for(let i in argumentsList){
            classname = argumentsList[i];
            _classes[classname] = classname;
            //Object.defineProperty(_classes, classname, {enumerable:true,configurable:true});
          }
          return clist.add(...argumentsList);
        },
        get: function(target, prop, receiver) {
          // this Symbol needs us to tell it what kind of thing this is
          // this needs to return 'Object' to be compatible with .observe and .mimic
          switch(prop){
            case Symbol.toStringTag:
              // trap the class toStringTag symbol and identify as an Object
              return 'Object';
              break;
            case Symbol.iterator:
              return clist.values();
              break;
            case 'prototype':
            case '__proto__':
              return [][prop];
              break;
            case 'push':
            case 'unshift':
              // trap the push/unshift and do our own:
              return function(){
                that.classes(...arguments);
                return clist.length;
              };
              break;
            case 'pop':
              // trap the toString and do our own:
              return function(){
                let token = clist[clist.length-1];
                delete that.classes[token]
                //clist.remove(token);
                return token;
              };
              break;
            case 'shift':
              // trap the toString and do our own:
              return function(){
                let token = clist[0];
                delete that.classes[token]
                //clist.remove(token);
                return token;
              };
              break;
            case 'toString':
            case Symbol.toPrimitive:
              // trap the toString and do our own:
              return function(){
                return clist.value;
              };
              break;
          }
          // otherwise, get the value from the dom
          if(clist[prop]){
            return clist[prop];
          }
          // or pass it through to the array
          if(typeof [][prop] === 'function') return [][prop].bind(clist);
          
          // or we are asking about a class?
          if(clist.contains(prop)){
            return true;
          }
          // or just let it bubble
          return Reflect.get(...arguments);
        },
        set: function(obj, prop, value) {
          // only actually set if the property is a number, everything else is not a value, but a property
          if(SeeIf.IsOnlyNumbers(prop)){
            that.classes(value);
            return true;
          }
          // if the prop is a string with value, then add that
          if(SeeIf.IsStringAndHasValue(prop)){
            // if the value is truey, then we add
            if(value) that.classes(prop);
            // but if it's falsey, then we remove.
            else {
              _classes[prop] = undefined;
              clist.remove(prop);
            }
            return true;
          }
          return Reflect.set(obj, prop, value);
        },
        ownKeys: function(target){
          // ownKeys wants an array with our properties and 'prototype'
          let rtn = Object.keys(Doh.meld_into_objectobject(clist));
          // custom ownKeys on anonymous functions need to passthrough the prototype but...
          // the engine seems to clip it off though, when we do things like iterate for loops
          rtn.push('length');
          rtn.push('prototype');
          return rtn;
        },
        getOwnPropertyDescriptor: function(target, prop) { // called for every property
          if(prop !== 'prototype' && prop !== 'length'){
            // detect forwarded properties from _classes and retrieve them instead
            if(SeeIf.IsStringAndHasValue(prop)){
              let prop_desc = Object.getOwnPropertyDescriptor(_classes, prop);
              if(prop_desc)if(prop_desc.set){
                return prop_desc;
              }
            }
            // otherwise our shortcut will work
            return {
              enumerable: true,
              configurable: true,
              value: clist[prop]
            };
          }
          // prototype is special and needs to match up with the original or it complains
          else return Reflect.getOwnPropertyDescriptor(target, prop);
        },
        defineProperty: function(target, prop, descriptor) {
          // forward property setters to _classes
          if(SeeIf.IsStringAndHasValue(prop)){
            let rtn = Object.defineProperty(_classes, prop, descriptor);
            if(descriptor.set){
              // defining the setter means Doh is setting up the handlers for the first time
              Doh.observe(_classes, prop, function(object, prop_name, new_value){
                
                
                if(new_value){
                  // if _css is different from the dom, try to change it once
                  // use the .e.css because we are inside .css already
                  clist.add(prop);
                } else {
                  clist.remove(prop);
                }
                
              });
            }
            return rtn;
          }
        },
        has: function(target, prop){
          return clist.contains(prop);
        },
        deleteProperty: function(target, prop){
          let classname;
          if(SeeIf.IsOnlyNumbers(prop)){
            classname = clist[Number(prop)];
          }
          else if(SeeIf.IsStringAndHasValue(prop)){
            classname = prop;
          }
          _classes[classname] = undefined;
          clist.remove(classname);
        },
        getPrototypeOf: function(target) {
          return Array;
        }
      });
      
      Doh.meld_arrays(this.classes, initial_classes);
      
      // make our new .css property into a proxy that handles all our different use cases
      this.css = new Proxy(_css, {
        // since we proxy a function, we can be used as one.
        // css({prop:val}) OR css(prop, val) OR css("prop:val;") or
        apply: function(target, thisArg, argumentsList){
          if(argumentsList.length){
            // we need to correct for the setters being affected by this call
            let prop = argumentsList[0], value = argumentsList[1];
            if(SeeIf.IsEmptyString(value)){
              // an empty string means delete the property
              // update our cache to match this
              _css[prop] = undefined;
            }
             // a value indicates a set, tell our setters
            if(value) _css[prop] = value;
            // a string means that:
            //    we want it converted to a setter object first
            //    or we want to get the value
            else if(typeof prop === 'string') {
              if(prop.indexOf(':') > 0){
                argumentsList[0] = prop = that.get_css_from_style(prop);
              }
              // if we don't convert prop above, then it won't be iterated below, which is correct for a get.
            }
            // if prop is enumerable, then it's a setter object
            if(typeof prop === 'object'){
              for(let prop_name in prop){
                // trigger setters for everything inside, they do their own comparing.
                if(SeeIf.IsEmptyString(prop[prop_name])){
                  // an empty string means delete the property
                  // update our cache to match this
                  _css[prop_name] = undefined;
                } else {
                  _css[prop_name] = prop[prop_name];
                }
              }
            }
            // finally call css and apply the args
            // jQuery still does so much for us, we just can't get away from it.
            return that.e.css.apply(that.e, argumentsList);
          } else return;
        },
        get: function(target, prop, receiver) {
          // this Symbol needs us to tell it what kind of thing this is
          // this needs to return 'Object' to be compatible with .observe and .mimic
          if(prop === Symbol.toStringTag) return 'Object';
          // otherwise, get the computed value
          return that.e.css(prop);
        },
        set: function(obj, prop, value) {
          // call our own .css handler so setters will be triggered
          that.css(prop, value);
          return true;
        },
        ownKeys: function(target){
          // ownKeys wants an array with our properties and 'prototype'
          let rtn = Object.keys(that.get_css_from_style());
          // custom ownKeys on anonymous functions need to passthrough the prototype but...
          // the engine seems to clip it off though, when we do things like iterate for loops
          rtn.push('prototype');
          return rtn;
        },
        getOwnPropertyDescriptor: function(target, prop) { // called for every property
          if(prop !== 'prototype'){
            // detect forwarded properties from _css and retrieve them instead
            let prop_desc = Object.getOwnPropertyDescriptor(_css, prop);
            if(prop_desc)if(prop_desc.set){
              return prop_desc;
            }
            // otherwise our shortcut will work
            return {
              enumerable: true,
              configurable: true,
              value: that.domobj.style[prop]
            };
          }
          // prototype is special and needs to match up with the original or it complains
          else return Reflect.getOwnPropertyDescriptor(target, prop);
        },
        defineProperty: function(target, prop, descriptor) {
          // forward property setters to _css
          let rtn = Object.defineProperty(_css, prop, descriptor);
          if(descriptor.set){
            // defining the setter means Doh is setting up the handlers for the first time
            Doh.observe(_css, prop, function(object, prop_name, new_value){
              if(that.e.css(prop) == new_value) return;
              // if _css is different from the dom, try to change it once
              // use the .e.css because we are inside .css already
              that.e.css(prop, new_value);
            });
          }
          return rtn;
        },
        has: function(target, prop){
          return (prop in that.get_css_from_style());
        },
        deleteProperty: function(target, prop){
          that.css(prop, '');
        },
      });

      this.attr = new Proxy(_attr, {
        apply: function(target, thisArg, argumentsList){
          if(argumentsList.length){
            let prop = argumentsList[0], value = argumentsList[1];
            if(SeeIf.IsEmptyString(value) || value === null){
              // an empty string means delete the property
              // update our cache to match this
              _attr[prop] = undefined;
              // attr needs null, so we fix it
              value = argumentsList[1] = null;
            }
            if(value) _attr[prop] = value;
            else if(typeof prop === 'object'){
              for(let prop_name in prop){
                // trigger setters for everything inside, they do their own comparing.
                if(SeeIf.IsEmptyString(prop[prop_name]) || value === null){
                  // an empty string means delete the property
                  // update our cache to match this
                  _attr[prop_name] = undefined;
                } else {
                  _attr[prop_name] = prop[prop_name];
                }
              }
            }
            return that.e.attr.apply(that.e, argumentsList);
          } else return;
        },
        get: function(target, prop, receiver) {
          if(prop === Symbol.toStringTag) return 'Object';
          return that.e.attr(prop);
        },
        set: function(obj, prop, value) {
          // set _attr so setters will be triggered
          return that.attr(prop, value);
        },
        ownKeys: function(target){
          let domobj = that.domobj, rtn = [];
          if(domobj.hasAttributes()){
            let attrs = domobj.attributes;
            for(let attribute of attrs){
              rtn.push(attribute.name)
            }
          }
          // custom ownKeys on anonymous functions need to passthrough the prototype but...
          // the engine seems to clip it off though, when we do things like iterate for loops
          rtn.push('prototype');
          return rtn;
        },
        getOwnPropertyDescriptor: function(target, prop) { // called for every property
          if(prop !== 'prototype'){
            // detect forwarded properties from _attr and retrieve them instead
            let prop_desc = Object.getOwnPropertyDescriptor(_attr, prop);
            if(prop_desc)if(prop_desc.set){
              return prop_desc;
            }
            // otherwise our shortcut will work
            return {
              enumerable: true,
              configurable: true,
              writable: true,
              value: that.e.attr(prop)
            };
          }
          // prototype is special and needs to match up with the original or it complains
          else return Reflect.getOwnPropertyDescriptor(target, prop);
        },
        defineProperty: function(target, prop, descriptor) {
          // forward property setters to _attr
          let rtn = Object.defineProperty(_attr, prop, descriptor);
          if(descriptor.set){
            // defining the setter means Doh is setting up the handlers for the first time
            Doh.observe(_attr, prop, function(object, prop_name, new_value){
              // we need to watch for changes and do something?
              if(that.e.attr(prop) == new_value) return;
              // if _attr is different from the dom, try to change it once
              // use the .e.attr because we are inside .attr already
              that.e.attr(prop, new_value);
            });
          }
          return rtn;
        },
        has: function(target, key){
          return that.domobj.hasAttribute(key);
        },
        deleteProperty: function(target, prop){
          that.attr(prop, null);
        },
      });
      
      // stash any initial style
      if(this.style){
        //initial_style
        this.initial_style = this.style;
      }
      // clear the property so it will trigger the new setter and actually set our initial styles
      this.style = '';
      // style is an old idea, lets fix it so that it's more useful
      // turn style into a getter/setter so it can be more handy for us
      Doh.observe(this, 'style', function(object, prop, new_value){
        // we *could* just set the value, but we want to update our cache and
        // trigger .css setters for each property in the string.
        if(typeof new_value === 'string') that.css(new_value);
      });
      Object.defineProperty(this, 'style', {
        // if we have a setter, then we must have a getter
        // our fancy getter retrieves the original value storage, which
        // is the thing that gets updated.
        get: function(){
          return that.domobj.style.cssText;
        },
        // make this not enumerable because the data is technically duplicated from .css which is more reliable and useful
        enumerable: false,
        configurable: true,
      });
      // set style before css so it doesn't blow the css away
      if(this.initial_style){
        // now use our super useful property
        this.style = this.initial_style;
      }
      
      // merge in idea css ( Don't move this, it needs to be after style is set )
      if(idea_css) this.css(idea_css);
      // apply initial attributes
      if(this.initial_attr) this.attr(this.initial_attr);
      
      // if we made it this far and still have no id, then we need to assign a new one
      if(this.e.length === 1 && !this.id) {
        // get the id from attributes
        this.id = this.attr.id;
        Doh.mimic(this, 'id', this.attr, 'id');
        // otherwise give it a new one
        if(!this.id) {
          this.id = 'dobj_'+Doh.new_id();
          // if we have to give it a new one, then we need to set the domobj too
          //this.attr('id', this.id);
          // now that the id is linked to the attr id, we don't need to update anything.
        }
      }
      
      // stash initial html, if any
      if(this.html) initial_html = this.html;
      // clear the property so it will trigger the new setter and actually set our initial html
      this.html = '';
      // .html is an old idea, lets fix it so that it's more useful
      // turn style into a getter/setter so it can be more handy for us
      Doh.observe(this, 'html', function(object, prop, new_value){
        // only try and set html if it's actually set to something
        if(SeeIf.NotEmptyString(new_value)){
          // ... and there aren't already children
          if(that.e.children().length > 0) {
            // set inner text
            // WARNING: this will overwrite children
            //Doh.warn(`html object overwrote children with: "${new_value}"`,'\n',this.idealize());
            Doh.warn(`html object overwrote children`,'\n');
          }
          if(that.e.html() != new_value) that.e.html(new_value);
        }
      });
      Object.defineProperty(this, 'html', {
        // if we have a setter, then we must have a getter
        // our fancy getter retrieves the original value storage, which
        // is the thing that gets updated.
        get: function(){
          return that.e.html();
        },
        // techincally this is duplicate data, but that's for you to figure out.
        enumerable: false,
        configurable: true,
      });
      // now use our super useful property
      if(initial_html) this.html = initial_html;
      
      /**
       *  
       *  resizing
       *  moving
       *  
       *  idling
       *  
       *  approaching
       *  hovering
       *  pressing    holding
       *  releasing
       *  leaving
       *  
       *  
       *  actStart
       *  acted
       *  actEnd
       *  
       *  pressStart
       *  pressed
       *  pressEnd
       *  
       *  moveStart
       *  moved
       *  moveEnd
       *  
       *  resizeStart
       *  resized
       *  resizeEnd
       *  
       *  hoverOver
       *  hovered
       *  hoverOut
       *  
       *  dblpushed
       *  
       */
      /*
      this.when = new Proxy(_when, {
        apply: function(target, thisArg, argumentsList){
          if(argumentsList.length){
            let prop = argumentsList[0], value = argumentsList[1];
            if(SeeIf.IsEmptyString(value) || value === null){
              // an empty string means delete the property
              // update our cache to match this
              _when[prop] = undefined;
              // attr needs null, so we fix it
              value = argumentsList[1] = null;
            }
            if(value) _when[prop] = value;
            else if(typeof prop === 'object'){
              for(let prop_name in prop){
                // trigger setters for everything inside, they do their own comparing.
                if(SeeIf.IsEmptyString(prop[prop_name]) || value === null){
                  // an empty string means delete the property
                  // update our cache to match this
                  _when[prop_name] = undefined;
                } else {
                  _when[prop_name] = prop[prop_name];
                }
              }
            }
            return that.e.on.apply(that.e, argumentsList);
          } else return;
        },
        get: function(target, prop, receiver) {
          if(prop === Symbol.toStringTag) return 'Object';
          return that.e.attr(prop);
        },
        set: function(obj, prop, value) {
          // set _when so setters will be triggered
          return that.when(prop, value);
        },
        ownKeys: function(target){
          let domobj = that.domobj, rtn = [];
          if(domobj.hasAttributes()){
            let attrs = domobj.attributes;
            for(let attribute of attrs){
              rtn.push(attribute.name)
            }
          }
          // custom ownKeys on anonymous functions need to passthrough the prototype but...
          // the engine seems to clip it off for us when we do things like iterate for loops
          rtn.push('prototype');
          return rtn;
        },
        getOwnPropertyDescriptor: function(target, prop) { // called for every property
          if(prop !== 'prototype'){
            // detect forwarded properties from _when and retrieve them instead
            let prop_desc = Object.getOwnPropertyDescriptor(_when, prop);
            if(prop_desc)if(prop_desc.set){
              return prop_desc;
            }
            // otherwise our shortcut will work
            return {
              enumerable: true,
              configurable: true,
              writable: true,
              value: that.e.attr(prop)
            };
          }
          // prototype is special and needs to match up with the original or it complains
          else return Reflect.getOwnPropertyDescriptor(target, prop);
        },
        defineProperty: function(target, prop, descriptor) {
          // forward property setters to _when
          let rtn = Object.defineProperty(_when, prop, descriptor);
          if(descriptor.set){
            // defining the setter means Doh is setting up the handlers for the first time
            Doh.observe(_when, prop, function(object, prop_name, new_value){
              // we need to watch for changes and do something?
              if(that.e.attr(prop) == new_value) return;
              // if _when is different from the dom, try to change it once
              // use the .e.attr because we are inside .attr already
              that.e.attr(prop, new_value);
            });
          }
          return rtn;
        },
        has: function(target, key){
          return that.domobj.hasAttribute(key);
        },
        deleteProperty: function(target, prop){
          that.attr(prop, null);
        },
      });
      Doh.meld_objects(this.when, initial_when);
      //*/
      
      Doh.mimic(this, 'attrs', this, 'attr');
    },

    get_css_from_style: function(style){
      style = style || this.domobj.style.cssText;
      let rtn = {};
      if(typeof style === 'string') {
        style = style.trim();
        style.split(';').forEach((statement) => {
          if(statement){
            let part = statement.split(':');
            if(part[0] && part[1]){
              // pretrim part 1 (the value)
              part[1] = part[1].trim();
              // if the value is only a number or float, convert it to that, so it can be converted later if numbers are allowed
              rtn[part[0].trim()] = (SeeIf.IsOnlyNumbers(part[1])?Number(part[1]):part[1]);
            }
          }
        });
      }
      return rtn;
    },
    pre_builder_phase:function() {
      // we rely on children waiting to be appended,
      // stash the intended machine state and use 'control_phase'
      if(this.machine_built_to !== 'control_phase'){
        this._machine_built_to = this.machine_built_to;
        this.machine_built_to = 'control_phase';
      }
    },
    builder_phase:function(){
      if(this._machine_built_to){
        // if we stashed the intended state, restore it here
        this.machine_built_to = this._machine_built_to;
        // if this is already past then we need to be append phase
      } else {
        // tell the append to machine children to html_phase
        this.machine_built_to = 'html_phase';
      }
    },
    html_phase:function(){
      // convert the parent to a doh object if not already one
      if( typeof this.builder === 'string' || this.builder instanceof Doh.jQuery) {
        Doh.warn('html_phase found a builder:',this.builder,'that was a string or jQuery instance');
        this.builder = Doh.get_dobj(this.builder);
      }
      
      // if this is a string, convert it to a jQuery object
      if( typeof this.e === 'string' ) {
        Doh.error('html_phase found a e:',this.e,'that is a string');
        // it's too late for us to still have a string e. 
        // lots of stuff happens in object_phase that we missed now.
      }
      
      if(!this.builder.e){
        Doh.warn('html_phase found a parent:',this.builder,'that has no .e:',this.builder.e);
        this.builder = Doh.get_dobj(this.builder);
      }
      // put in parent (can be used to relocate as well)
      this.builder.e.append(this.e);

      if(this.built) this.machine_built(this.machine_built_to);
      
      if(this.control && !this.attr.title && ! this.e.attr('title')){
        Doh.UntitledControls = Doh.UntitledControls || {};
        Doh.UntitledControls[this.id]=this;
      }
      
      if(Doh.ApplyFixes){
        this.machine.completed.append_phase = true;
      }
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

    get_style:function(){
      Doh.warn('.get_style is deprecated. Use this.style instead.',this.idealize());
      return this.style;
    },
    set_style:function(style){
      Doh.warn('.set_style is deprecated. Use this.style instead.',this.idealize());
      this.style = style;
    },
    // set_css({prop:val}) OR set_css(prop, val) OR set_css("prop:val;")
    set_css: function(o, p = undefined) {
      if(!Doh.ReduceWarnings || !Doh.HasReported['set_css']) Doh.warn('.set_css(',o,',',p,') is deprecated. Use .css(',o,',',p,') instead',this.idealize());
      Doh.HasReported['set_css'] = true;
      return this.css(...arguments);
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

    var opts = Doh.meld_objects({},{duration:400},that.animation_options);

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
    let queue = Doh.AnimationQueues[queue_name];
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
    machine_built_to: 'animation_phase'
  });

  // AA:  It's a small thing, but I would move these html primitive upwards, so they are directly below 'html' itself.

  Pattern('span', 'element', {tag:'span'});

  Pattern('input', 'element', {
    tag: 'input'
  });

  Pattern('input_value', {
    available_properties:{'value':'string to put in the value HTML attribute'},
    pre_builder_phase: function(){
      if (typeof this.value !== 'undefined') this.attr.value = this.value;
    }
  });

  Pattern('text', ['input', 'input_value'], {
    attr: {type: 'text'},
  });

  Pattern('password', ['input', 'input_value'], {
    placeholder: '',
    object_phase: function() {
      this.attr = {type: 'password', placeholder: this.placeholder};
    }
  });


  Pattern('hidden', ['input', 'input_value'], {
    attr: {type: 'hidden'}
  });

  Pattern('textarea', ['input'], {
    available_properties:{'value':'string to put in the textarea'},
    tag: 'textarea',
    attr: {spellcheck: 'false'},
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
    pre_builder_phase: function(){
      if (typeof this.value !== 'undefined' && typeof this.button_options.label == 'undefined') this.button_options.label = this.value;
    },
    html_phase: function(){
      this.e.button(this.button_options);
    },
    change_title: function(wut) {
      if(this.e)
        this.domobj.innerHTML = wut;
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
    attr: {disabled:'disabled'}
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
    // special melding will handle special building too.
    options:{},
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
    attr: {type: 'checkbox'},
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
      console.log('set_src',this.src_path);
      this.domobj.setAttribute('src',this.src_path);
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
              //console.log(that);
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
            of: this.domobj
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
      //console.log('drag start');
    },
    drag_drag:function(event, ui) {
      //console.log('drag drag');
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
  Doh.body = New('html',{tag:'body',e:jBody,builder:jBody.parent()}, 'object_phase');                 
});

OnLoad('/doh_js/element', function($){Pattern('element', 'html');});

OnLoad('/doh_js/patterns', function($){});
