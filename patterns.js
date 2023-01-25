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
  Doh.DebugMode = true;

if(typeof exports != 'undefined') {
  exports = top.Doh;
}

/* **** Prepare Doh **** */
// the most important function in Doh:
Doh.meld_objects = function(destination){
  
  destination = destination || {}; // this may seem unneccesary but OH IS IT EVER NECCESSARY
  var obj, i;
  for(let arg in arguments){
    obj = arguments[arg];
    if(obj === destination) continue;
    i = '';
    for(i in obj){
      destination[i] = obj[i];
    }
  }
  return destination;
};

OnLoad('/doh_js/see_if', function($){
// enshrine the definitions of variable states
  var SeeIf_Templates = {
    /*
     * These have to be in this order because they are the base types for type_of
     * When we loop over SeeIf, we will always catch one of these, so these are the most primitive types
     */
    // dohobject refers to values that are a complex objectobject which was built with Doh
    'IsDohObject':(value) => `(InstanceOf?InstanceOf(${value}):false)`,
    // objectobject refers to values that are complex objects with named properties. No flat values or number-keyed lists. 
    'IsObjectObject':(value) => `(typeof ${value} === 'object' && toString.call(${value}) == '[object Object]')`,
    // function refers to values that are actual functions
    'IsFunction':(value) => `typeof ${value} === 'function'`,
    // string refers to values that are actual string datatype
    'IsString':(value) => `typeof ${value} === 'string'`,
    // Number refers to values that are a number datatype EXCEPT NaN (Not a Number)
    'IsNumber':(value) => `(typeof ${value} === 'number' && !isNaN(${value}))`,
    // array refers to values that are actual array datatype
    'IsArray':(value) => `Array.isArray(${value})`,
    // boolean refers to values that are actual native boolean datatype
    'IsBoolean':(value) => `typeof ${value} === 'boolean'`,
    // null is supposed to refer to objects that have been defined, but have no value. In truth because of "falsey" values, it can have other meanings
    'IsNull':(value) => `${value} === null`,
    // undefined refers to objects that have not been defined anywhere in code yet
    'IsUndefined':(value) => `typeof ${value} === 'undefined'`,
    // NotNumber refers to values that are not a number OR NaN (NotaNumber object)
    'NotNumber':(value) => `(typeof ${value} !== 'number' || isNaN(${value}))`,
    /*
     * Now the rest for type_match and regular SeeIf usage
     */
    // defined is supposed to refer to having a usable reference. undefined means without reference. null references are still unusable in JS, so defined nulls should demand special handling
    'IsDefined':(value) => `(typeof ${value} !== 'undefined' && ${value} !== null)`,
    // true refers to the binary 1 state (Boolean)
    'IsTrue':(value) => `${value} === true`,
    // false refers to the binary 0 state (Boolean)
    'IsFalse':(value) => `${value} === false`,
    // truey referes to values that equal binary 1, even if represented by a different datatype. Truey values include: True, HasValue, 1...[positive numbers]
    'IsTruey':(value) => `${value} == true`,
    // falsey refers to values that equal binary 0, even if represented by a different datatype. Falsey values include: Undefined, Null, False, '', 0, -1...[negative numbers]
    'IsFalsey':(value) => `!${value}`,
    // arraylike refers to values that act like arrays in every way. they can be used by native array methods
    'IsArrayLike':(value) => `(Array.isArray(${value}) || ((typeof ${value} !== 'undefined' && ${value} !== null) && typeof value[Symbol.iterator] === 'function') && typeof ${value}.length === 'number' && typeof ${value} !== 'string')`,
    // iterable refers to values that define a Symbol iterator so that native methods can iterate over them
    'IsIterable':(value) => `((typeof ${value} !== 'undefined' && ${value} !== null) && typeof value[Symbol.iterator] === 'function')`,
    // enumerable refers to values that can be iterated over in a for/in loop
    // all objects can be iterated in a for loop and all arrays are objects too.
    'IsEnumerable':(value) => `typeof ${value} === 'object'`,
    // literal refers to values that are static literals. Strings, booleans, numbers, etc. Basically anything that isn't an object or array. flat values.
    'IsLiteral':(value) => `typeof ${value} !== 'object'`,
    // to-be-replaced:
    // emptyobject refers to values that are objectobject or arraylike but have no properties of their own (empty of named properties that aren't javascript native)
    'IsEmptyObject':(value) => `${value}`,
    // keysafe refers to values that are safe for use as the key name in a complex objectobject
    'IsKeySafe':(value) => `(typeof ${value} === 'string' || (typeof ${value} === 'number' && !isNaN(${value})))`,
    // emptystring refers to values that are string literals with no contents
    'IsEmptyString':(value) => `${value} === ''`,
    // hasvalue refers to values that are defined and notemptystring. specifically this includes 0 and negative numbers where truey does not.
    'HasValue':(value) => `((typeof ${value} !== 'undefined' && ${value} !== null) && ${value} !== '')`,
    
    // Not conditions, interestingly different
    'NotUndefined':(value) => `typeof ${value} !== 'undefined'`,
    'NotNull':(value) => `${value} !== null`,
    'NotFalse':(value) => `${value} !== false`,
    'NotTrue':(value) => `${value} !== true`,
    'NotBoolean':(value) => `typeof ${value} !== 'boolean'`,
    'NotString':(value) => `typeof ${value} !== 'string'`,
    'NotArray':(value) => `!Array.isArray(${value})`,
    'NotArrayLike':(value) => `!(((typeof ${value} !== 'undefined' && ${value} !== null) && typeof value[Symbol.iterator] === 'function') && typeof ${value}.length === 'number' && typeof ${value} !== 'string')`,
    'NotIterable':(value) => `!((typeof ${value} !== 'undefined' && ${value} !== null) && typeof value[Symbol.iterator] === 'function')`,
    'NotEnumerable':(value) => `typeof ${value} !== 'object'`,
    'NotFunction':(value) => `typeof ${value} !== 'function'`,
    'NotLiteral':(value) => `typeof ${value} === 'object'`,
    'NotObjectObject':(value) => `!(typeof ${value} === 'object' && toString.call(${value}) == '[object Object]')`,
    'NotDohObject':(value) => `!InstanceOf(${value})`,
    'NotKeySafe':(value) => `!(typeof ${value} === 'string' || (typeof ${value} === 'number' && !isNaN(${value})))`,
    'NotEmptyString':(value) => `${value} !== ''`,
    'LacksValue':(value) => `(typeof ${value} === 'undefined' || ${value} === null || ${value} === '')`,
    'IsAnything':(value) => `true`,
  };
  Doh.meld_objects(SeeIf_Templates, {
    'NotDefined':SeeIf_Templates.IsUndefined,
    'NotFalsey':SeeIf_Templates.IsTruey,
    'NotTruey':SeeIf_Templates.IsFalsey,
    'IsSet':SeeIf_Templates.IsDefined,
    'NotSet':SeeIf_Templates.IsUndefined,
  });
  for(let i in SeeIf_Templates){
    SeeIf[i] = new Function('value', `return ${SeeIf_Templates[i]('value')}`);
  }
  SeeIf.IsEmptyObject = function(value) {
    if(SeeIf.IsDefined(value)) {
      if (value.length && value.length > 0) { 
        return false;
      }

      for (var key in value) {
        if (hasOwnProperty.call(value, key)) {
          return false;
        }
      }
    }
    return true;    
  };
  SeeIf.NotEmptyObject = function(value){
    return !SeeIf.IsEmptyObject(value);
  };
}, 'SeeIf');

OnLoad('/doh_js/core', function($){
  
  if(top.DohWatch)if(DohWatch.SeeIf){
    DohWatch.SeeIf = false;
    delete DohWatch.SeeIf;
  }
  
  Doh.meld_objects(Doh, {
    
    ModuleCurrentlyRunning: '/doh_js/core',
    
    Version:'2.0a',
    
    ModulePatterns: {},
    PatternModule: {},

    // work on pattern for watching any key setter and getter
    

    //return items from the elems array that pass callback
    grep: function( elems, callback, inv ) {
      var ret = [];
      // Go through the array, only saving the items
      // that pass the validator function
      for ( var i = 0, length = elems.length; i < length; i++ ) {
        if ( !inv !== !callback( elems[ i ], i ) ) {
          ret.push( elems[ i ] );
        }
      }
      return ret;
    },

    in_array: function( elem, array ) {
      
      if ( typeof array == 'undefined') return -1;
      
      if ( array.indexOf ) {
        return array.indexOf( elem );
      }

      for ( var i = 0, length = array.length; i < length; i++ ) {
        if ( array[ i ] === elem ) {
          return i;
        }
      }

      return -1;
    },
    
    _log: function(args, log_type, logger_method, logger){
      log_type = log_type || '';
      logger_method = logger_method || 'log';
      //if(logger_method === 'log') logger_method = 'trace';
      logger = logger || console;
      var logger_args = [log_type];
      for(var i in args){
        if(i === 'length') continue;
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
    log: function(){
      Doh._log(arguments, 'Doh:', 'trace');
    },
    /**
     *  @brief return a custom Doh error
     *
     *  @param [in] context, context, ...   object(s) of relevence to the error
     *  @return Patterns.error object
     *
     *  @details
     *  Doh.error('error message', object1, 'some string', objectN, ...);
     */
    error: function(){
      Doh._log(arguments, 'Doh ERROR:', 'error');
      // build and return the custom error
      //return New({pattern:'error',args:arguments});
    },
    /**
     *  @brief return a custom Doh warning
     *
     *  @param [in] context, context, ...   object(s) of relevence to the error
     *  @return Patterns.error object
     *
     *  @details
     *  Doh.error('error message', object1, 'some string', objectN, ...);
     */
    warn: function(){
      Doh._log(arguments, 'Doh Warning:', 'warn');
      //if(Patterns.warning)
      //  return New({pattern:'warning',args:arguments});
    },

    /**
     *  @brief Get a new id
     *
     *  @return A new unique id
     */
    NewIdCounter:0,
    new_id: function () {
      return this.NewIdCounter += 1;
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

    array_move: function(array, from_index, to_index) {
      array.splice(to_index, 0, array.splice(from_index, 1)[0]);
      return array;
    },

    // allow storage of patterns
    Patterns: {},
    
    // This is used by the builder to a mix a pattern into a new instance of an object
    mixin_pattern: function(destination, pattern){

      if(Patterns[pattern]){
        if(!InstanceOf(destination, pattern)){
          // check for invalid mixin
          Doh.meld_ideas(destination, Patterns[pattern]);

          destination.inherited[pattern] = Patterns[pattern];
        }
      } else {
        Doh.error('Doh.mixin_pattern(',destination,',',pattern,') did not find the pattern');
      }
    },
    
    extend_inherits: function(inherits, skip_core = false){
      var extended = {};
      if(SeeIf.NotObjectObject(inherits)) inherits = Doh.meld_into_objectobject(inherits);
      for(var pattern_name in inherits){
        if(!Patterns[pattern_name]) throw Doh.error('Doh.extend_inherits() did not find pattern:', pattern_name, 'in inherits list:', inherits); // CHRIS:  Andy added this error msg, is there a better way?
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

    array_unique: function(arr){
      // reduce the array to contain no dupes via grep/in_array
      return Doh.grep(arr,function(v,k){
          return Doh.in_array(v,arr) === k;
      });
    },

    object_keys_from_array_values: function (arr){
      var obj = {};
      arr = arr || [];
      for(var i=0; i<arr.length; i++){
        obj[arr[i]] = true
      }
      return obj;
    },

    meld_arrays: function(destination, arr, force_new){

      arr = arr || [];
      if(force_new) return Doh._meld_arrays(destination, arr);

      destination = destination || [];
      // loop over arr
      for(var i=0; i<arr.length; i++){
        // if the value is not in destination
        if(Doh.in_array(arr[i], destination) == -1){
          // add it
          destination.push(arr[i]);
        }
      }
      return destination;
    },
    _meld_arrays: function(arr1, arr2){
      var destination = Doh.meld_objects([], arr1);
      // loop over arr
      for(var i=0; i<arr2.length; i++){
        // if the value is not in arr1
        if(Doh.in_array(arr2[i], arr1) == -1){
          // add it to the destination
          destination.push(arr2[i]);
        }
      }
      return destination;
    },

    /**
     *  @brief meld all the ways we can format a list of args into a set of object keys
     *
     *  @param [in] aruguments  String, Array, Array-like-object, or Object to
     *                          meld with. (See details)
     *  @return {}
     *
     * 'pattern_name_1'
     * ['pattern_name_1', 'pattern_name_2']
     * {0:'pattern_name_1', 1:'pattern_name_2'}
     * {'pattern_name_1':true, 'pattern_name_2':true}
     *
     * *RESULTS IN:* {'pattern_name_1':true, 'pattern_name_2':true}
     * *OR* {}
     **/
    meld_into_objectobject: function(){
      // we always need a new object
      let obj = {}, list, item;
      for(let arg in arguments){
        // walk through all arguments
        list = arguments[arg];
        // allow value to be a string
        if (typeof list === 'string')
          //NOTE: we can expand this to accept limited depth and complexity
          //      like, CSV or dot-notated (this.that.theother)
          obj[list] = true;
        // or an object (array and object, technically)
        else if (SeeIf.IsEnumerable(list)){
          item = '';
          for(item in list){
            if (item !== 'length'){
              // allow the array structure to have the list in key (Key is not a number)
              //NOTE .is key safe?
              if(isNaN(item)) obj[item] = list[item];
              // or in the list
              else obj[list[item]] = true;
            }
          }
        }
      }
      // send what we found, even if empty
      return obj;
    },
    
    // ADD COMMENTS HERE
    // old method of nesting closures
    meld_methods: function(obj, method, extension){
        return function(){
          method.apply(obj, arguments);
          extension.apply(obj, arguments);
          return obj;
        }
    },

    // given an object and method name, return an array of function references for
    // inherited patterns that implement the named method
    meld_method_stack: function(object, method_name){
      let meld_method_order = [], pre_meld_method_order = [], ilist = object.inherited;
      for(let i in ilist){
        if(object.inherited[i]['pre_'+method_name]) pre_meld_method_order.push(object.inherited[i]['pre_'+method_name]);
        if(object.inherited[i][method_name]) meld_method_order.push(object.inherited[i][method_name]);
      }
      return pre_meld_method_order.concat(meld_method_order);
    },
    // return a closure for obj[method_name] that will call each function in method_stack
    meld_method: function(obj, method_stack){
      // if the stack is a string, then we are trying to meld a method from object.inherited
      let method_name = false;
      if(typeof method_stack === 'string'){
        method_name = method_stack;
        method_stack = Doh.meld_method_stack(obj, method_name);
      }
      let melded_method = function(){
        // this melder always does the same thing:
        //  walk the method stack and apply each method to the bound object
        let len = method_stack.length;
        for(let i=0;i<len;i++){
          method_stack[i].apply(obj, arguments);
        }
        return obj;
      };
      melded_method.meld_stack = method_stack;
      melded_method.update_meld_stack = function(newStack){
        if(!newStack && method_name){
          method_stack = Doh.meld_method_stack(obj, method_name);
          return;
        }
        method_stack = newStack;
      };
      return melded_method;
    },
    // update meld_methods and phases of obj
    update_meld_methods: function(obj){
      for(let melded_prop in obj.melded){
        if(obj.melded[melded_prop] === 'method' || obj.melded[melded_prop] === 'phase'){
          // conditionally update only the method stack
          if(typeof obj[melded_prop] === 'function')if(typeof obj[melded_prop].update_meld_stack === 'function'){
            obj[melded_prop].update_meld_stack();
            continue;
          }
          obj[melded_prop] = Doh.meld_method(obj, melded_prop);
        }
      }
    },

/*
Doh.type_of()
'IsUndefined'
Doh.type_of('')
'IsString'
Doh.type_of(0)
'IsNumber'
Doh.type_of(false)
'IsBoolean'
Doh.type_of(null)
'IsNull'
Doh.type_of([])
'IsArray'
Doh.type_of({})
'IsObjectObject'
Doh.type_of(function(){})
'IsFunction'
Doh.type_of(unet.uNetNodes['1-1'])
'IsDohObject'
*/
    type_of: function(value){
      let type;
      for(type in SeeIf){
        if(SeeIf[type](value)){
          return type;
        }
      }
      // SeeIf can't see it, so it's not defined
      return undefined;
    },
    
    MeldedTypeMatch: {
      // currently implemented meldable types
      'method':SeeIf.IsFunction,
      'phase':SeeIf.IsFunction,
      'object':SeeIf.IsObjectObject,
      'array':SeeIf.IsArray,
      'idea':SeeIf.IsObjectObject,
    },
    type_match: function(value, is){
      //if(Doh.type_of(Doh.MeldedTypeMatch[is]) === 'IsFunction')
      //if(SeeIf.IsFunction(Doh.MeldedTypeMatch[is]))
      //if(SeeIf['IsFunction'](Doh.MeldedTypeMatch[is]))
      if(typeof Doh.MeldedTypeMatch[is] === 'function')
        return Doh.MeldedTypeMatch[is](value);
      else if(typeof SeeIf[is] === 'function')
        return SeeIf[is](value);

      return false;
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

    meld_ideas:function(destination, idea, skip_methods) {
      idea = idea || {};
      
      let prop_name = '';
      //test melded stuff and make sure it is what we expect
      if(idea.melded){
        // we only want to know if the destination is going to be overwritten by the idea
        for(prop_name in idea.melded){
          if(destination.melded){
            // deal with destination defines a meld type that is different from idea
            if(destination.melded[prop_name])if(destination.melded[prop_name] != idea.melded[prop_name]){
              throw Doh.error('Doh.meld_ideas(',destination,',',idea,'). destination.melded[',prop_name,']:',destination.melded[prop_name],'will be overwritten by idea.melded[',prop_name,']:',idea.melded[prop_name]);
            }
          }
          // deal with destination already has a property of type that is incompatible with idea.melded type
          if(SeeIf.IsDefined(destination[prop_name])){
            if(!Doh.type_match(destination[prop_name], idea.melded[prop_name])){
              throw Doh.error('Doh.meld_ideas(',destination,',',idea,'). destination[',prop_name,']:',destination[prop_name],'is an incompatible type with idea.melded[',prop_name,']:',idea.melded[prop_name]);
            }
          }
          // deal with idea has a property of type that is incompatible with idea.melded type
          if(SeeIf.IsDefined(idea[prop_name])){
            if(!Doh.type_match(idea[prop_name], idea.melded[prop_name])){
              throw Doh.error('Doh.meld_ideas(',destination,',',idea,'). idea[',prop_name,']:',idea[prop_name],'is an incompatible type with idea.melded[',prop_name,']:',idea.melded[prop_name]);
            }
          }
        }
      }
      
      prop_name = '';
      for(prop_name in destination.melded){
        // deal with idea has a property of type that is incompatible with destination melded type
        if(SeeIf.IsDefined(idea[prop_name]))if(destination.melded[prop_name])if(!Doh.type_match(idea[prop_name], destination.melded[prop_name])){
          throw Doh.error('Doh.meld_ideas(',destination,',',idea,'). idea[',prop_name,']:',idea[prop_name],'is an incompatible type with destination.melded[',prop_name,']:',destination.melded[prop_name]);
        }
      }
      
      // build name-keyed objects of the melded value lists
      let melded = Doh.meld_objects(destination.melded, idea.melded);
      // loop over the idea and decide what to do with the properties
      prop_name = '';
      for(prop_name in idea){
        if(idea[prop_name] !== undefined && idea[prop_name] !== destination[prop_name]){
          if(melded[prop_name] === 'method' || melded[prop_name] === 'phase'){
            // we handle melded methods and phases later
            // we set to null to preserve property order
            destination[prop_name] = null;
            continue;
          }
          if(melded[prop_name] === 'object' || (typeof idea[prop_name] == 'object' && !Array.isArray(idea[prop_name]) && SeeIf.IsEmptyObject(idea[prop_name]))){
            // it's a melded object or an empty default
            destination[prop_name] = Doh.meld_objects(destination[prop_name], idea[prop_name]);
            continue;
          }
          if(melded[prop_name] === 'array' || (Array.isArray(idea[prop_name]) && !idea[prop_name].length)){
            // it's a melded array or an empty default
            destination[prop_name] = Doh.meld_arrays(destination[prop_name], idea[prop_name]);
            continue;
          }
          // stack the ifs for speed
          if(idea[prop_name].pattern)if(!idea[prop_name].machine)if(!idea[prop_name].skip_auto_build){
            // it's an auto-build property, auto-meld it below
            destination.melded[prop_name] = melded[prop_name] = 'idea';
          }
          if(melded[prop_name] === 'idea'){
            destination[prop_name] = destination[prop_name] || {};
            destination[prop_name] = Doh.meld_ideas(destination[prop_name], idea[prop_name]);
            continue;
          }
          
          // non-melded property
          destination[prop_name] = idea[prop_name];
        }
      }

      // this section is only run after the origin idea was inherited
      if(destination.inherited)if(destination.machine){
        // we update here so it only happens once
        // we only want to run this after the idea has been melded 
        // inherited is only present on instances, patterns don't have it
        // and neither do plain ideas
        Doh.update_meld_methods(destination);
      }

      return destination;
    },
    
    pattern_inherits_extended: function(pattern_name_or_inherits, skip_core = false){
      return Object.keys( Doh.extend_inherits( Doh.meld_into_objectobject(pattern_name_or_inherits) , skip_core) );
    },
    
    PatternInheritedBy: {},

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
        else throw Doh.error('Doh.pattern('+idea+') tried to make a pattern with no name');

        // inherits will be in the idea
        inherits = false;
      } else if (SeeIf.NotString(inherits) && SeeIf.NotArray(inherits)) {
        // inherits is the idea
        idea = inherits;
        // inherits will be in the idea
        inherits = false;
      }
      if(!idea) idea = {};
      // otherwise the arguments are as indicated

      // every pattern must know it's own key on the Patterns object
      idea.pattern = name;
      
      if(Patterns[name]){
        if(PatternModuleVictors[name] && (PatternModuleVictors[name] !== Doh.ModuleCurrentlyRunning)){
          Doh.warn('(',name,') pattern was going to be overwritten but was ignored.\nOriginal Module:',Doh.PatternModule[name],'\nNew Module:',Doh.ModuleCurrentlyRunning);
          return false;
        }
        Doh.warn('(',name,') pattern is being overwritten.\nOriginal Module:',Doh.PatternModule[name],'\nNew Module:',Doh.ModuleCurrentlyRunning);
      }
      // we crawl the properties of idea to deprecated stuff, only do this if we have been told to:
      if(Doh.DebugMode){
        // just generates a bunch of warns and stuff with a few possible fixes. Should not be used in production.
        Doh.see_pattern_keys(idea);
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
      // we need to default the .melded collection here:
      let meld_type_name, meld_type_js;
      for(var prop_name in idea.melded){
        meld_type_name = idea.melded[prop_name];
        if(SeeIf.IsDefined(idea[prop_name]))if(!Doh.type_match(idea[prop_name], meld_type_name)){
          throw Doh.error('Doh.patterns(',idea.pattern,').',prop_name,' was defined as a melded',meld_type_name,' but is not a',meld_type_name,'.',idea[prop_name],idea);
        }
        // find the base js for defaulting melded stuff
        switch(meld_type_name){
          case 'phase':
            meld_type_js = function(){};
            break;
          case 'method':
            meld_type_js = function(){};
            break;
          case 'object':
            meld_type_js = {};
            break;
          case 'array':
            meld_type_js = [];
            break;
          case 'idea':
            meld_type_js = {};
            break;
          default:
            // is it a known SeeIf type?
            if(!SeeIf[meld_type_name]){
              throw Doh.error('Doh.pattern(',idea.pattern,') tried to define unknown meld type:',meld_type_name,'for idea:',idea);
            }
            break;
        }
        // default the property if needed. if we define the meld, we should at least implement it
        if(meld_type_js){
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
    
    // MANDATORY FOR OBJECTS TO BE SINGLETON CLASSES
    Prototype: function(){
      var DohObject = function(){};
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
     *  @brief Build a new Doh Object
     */
    New: function(pattern, idea, phase){
      var i = '';

      // if the pattern is a string,
      if(SeeIf.IsString(pattern)){
        // then everything is normal
        idea = idea || {};
        // overwrite the idea's pattern?
        // NOTE: we need a new way to deal with this.
        if(SeeIf.IsString(idea.pattern))if(SeeIf.HasValue(idea.pattern))if(pattern !== idea.pattern){
          Doh.warn('Doh.New(',pattern,',',idea,',',phase,') was sent pattern:',pattern,'AND different idea.pattern:',idea.pattern);
          if(SeeIf.HasValue(idea.inherits)){
            if(SeeIf.NotObjectObject(idea.inherits)){
              // convert inherits from whatever it is to an object so we can add to it.
              idea.inherits = Doh.meld_into_objectobject(idea.inherits);
            }
          } else {
            idea.inherits = idea.inherits || {};
          }
          idea.inherits[idea.pattern] = true;
        }
        idea.pattern = pattern;

      // if the pattern is an array,
      } else if(SeeIf.IsArray(pattern)){
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
        // NOTE: What is this? blah. I mean, I get it, but also...
        idea.pattern = 'idea';
      // pattern is the idea
      } else {
        phase = idea;
        idea = pattern;
      }
      // ensure that the idea object is at least blank
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

      // normalize passed-in inherits
      // this should now contain all patterns defined in the many places that things can be added to objects
      if(idea.inherits) idea.inherits = Doh.meld_into_objectobject(idea.inherits);

      // the builder requires at least one pattern
      if(SeeIf.IsEmptyObject(idea.inherits)){
        if(!Patterns[idea.pattern]) {
          // we could not find at least one pattern
          // default to object
         Doh.error('New idea had no inherits OR no pattern was found, default pattern to "object"',idea);
         
         idea.pattern = 'object';
        }
      }

      // start with a fresh object and the container for recording inheritence
      var object = Doh.Prototype();

      object.inherited = object.inherited || {};
      // now that we have all the patterns defined and passed in, get the patterns that all that stuff depend on
      // collect a list of patterns by recursively crawling the pattern .inherits
      var patterns = Doh.extend_inherits(Patterns[idea.pattern].inherits);
      // allow the idea to specify last-second inherits to at the end
      var idea_patterns = Doh.extend_inherits(idea.inherits);
      // add inherited patterns from the idea if missing from patterns
      patterns = Doh.meld_objects(patterns, idea_patterns);

      // add the pattern last
      if(idea.pattern) patterns[idea.pattern] = true;
      
      // mixin each pattern
      i = '';
      for(i in patterns){
        if(!Patterns[i]){
          Doh.warn('Doh.New('+ idea.pattern + ') tried to inherit from "', i, '" but it was not found, skipping it entirely.');
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
      
      // do we need a proxy?
      let proxy = false,
      // stash a reference to the original object we started making
      originalObject = object,
      // a way for our melded methods to tell the outer method that we care about a key
      // keys are keys we care about, values must be true;
      setters = {}, getters = {},
      // local storage for loop iterators
      keys, watcher,
      // when we find the functions that watch an object, push to stack so the melder will pick it up
      set_stack = [], get_stack = [];
      
      // we crawl the properties of idea to deprecated stuff, only do this if we have been told to:
      if(Doh.DebugMode){
        // just generates a bunch of warns and stuff with a few possible fixes. Should not be used in production.
        Doh.see_pattern_keys(idea);
      
        // do we need to setup watches?
        for(let ancestor in object.inherited){
          // look for setters by pattern and key
          keys = Doh.WatchedKeySetters[ancestor];
          if(keys){
            watcher = '';
            for(watcher in keys){
              set_stack.push((function(keys, watcher, target, prop, value){
                if(watcher === prop)
                  keys[watcher](target, prop, value);
              }).bind(originalObject, keys, watcher));
              // someone wants us to have a proxy
              proxy = true;
              setters[watcher] = true;
            }
          }
          // look for getters by pattern and key
          keys = Doh.WatchedKeyGetters[ancestor];
          if(keys){
            watcher = '';
            for(watcher in keys){
              get_stack.push((function(keys, watcher, obj, prop, receiver){
                if(watcher === prop)
                  keys[watcher](obj, prop, receiver);
              }).bind(originalObject, keys, watcher));
              // someone wants us to have a proxy
              proxy = true;
              getters[watcher] = true;
            }
          }
        }
      
        //proxy = false;
        //if(proxy === true){
          // we need the proxy reference early, but late-binding the handlers should be fine
          originalObject.__handler__ = {};
          originalObject.__handler__.setters = setters;
          originalObject.__handler__.getters = getters;
          // we replace object here so that the rest of the system will use it in their closures
          object = new Proxy(originalObject, originalObject.__handler__);
        //}
      }
      
      // attach the object machine
      object.machine = function(phase){
        
        if(Doh.DebugMode){
          Doh.SeenPhases = Doh.SeenPhases || {};
          let watched_phase, command, command_value;
          for(let watched_phase in Doh.WatchedPhases){
            if(watched_phase === phase){
              Doh.SeenPhases[watched_phase] = Doh.SeenPhases[watched_phase] || {};
              command = '';
              command_value = '';
              for(command in Doh.WatchedPhases[watched_phase]){
                command_value = Doh.WatchedPhases[watched_phase][command];
                switch(command){
                  case 'rename':
                    if(!Doh.SeenPhases[watched_phase][object.pattern]) Doh.warn('Watched Phase:',watched_phase,'has been renamed to:',command_value,object);
                    phase = command_value;
                    break;
                  case 'throw':
                    // throw an error so we can trace from here
                    throw Doh.error('Watched Phase:',watched_phase,'wants to be thrown. It said:',command_value,object);
                    break;
                  case 'run':
                    if(!Doh.SeenPhases[watched_phase][object.pattern]) Doh.warn('Watched Phase:',watched_phase,'will run:',command_value,object);
                    command_value(object, phase);
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
      //object.machine = object.machine.bind(object);
      object.machine.completed = {};

      // add the idea to the object
      // now that the object has a machine, the phases and meld_methods will be added
      Doh.meld_ideas(object, idea);

      // mark the idea as inherited
      object.inherited.idea = idea;
      
      // update the meld methods to include the inherited idea we just added
      Doh.update_meld_methods(object);

      //fix the idealize method
      object.idealize = Doh.idealize;
      
      //fix the perspective method
      object.perspective = Doh.perspective.bind(object, object);
      
      // now we can add the handlers, since the object is finished being constructed and is ready to go through phases
      if(Doh.DebugMode){
      //if(proxy === true){
        //__handler__.has = function(target, key) {return key in target;};
        //__handler__.ownKeys = function(target) {return Reflect.ownKeys(target);};
        
        // use a fancy melded_method to apply our stack of methods to each set call
        originalObject.__handler__.melded_set = Doh.meld_method(originalObject, set_stack);
        originalObject.__handler__.set = function(target, prop, value){
          if(prop === '__original__') return target;
          if(target.__handler__.setters[prop]){ 
            //throw Doh.error('setter stuff:',object,target,prop,value);
            target.__handler__.melded_set(...arguments);
          }
          return Reflect.set(...arguments);
        };
        
        originalObject.__handler__.melded_get = Doh.meld_method(originalObject, get_stack);
        originalObject.__handler__.get = function(target, prop){
          if(prop === '__original__') return target;
          if(target.__handler__.getters[prop]){ 
            //throw Doh.error('getter stuff:',object,target,prop,receiver);
            target.__handler__.melded_get(...arguments);
          }
          return Reflect.get(...arguments);
        };
        
        // thing.watch('a_property','set',SeeIf.IsNumber,function(target,prop,value/receiver){})
        originalObject.watch = function(prop_name, type = 'set', value_condition = SeeIf.IsAnything, callback){
          
          let IsSeeIf = false;
          if(typeof value_condition === 'function'){
            for(let tester in SeeIf){
              if(value_condition === SeeIf[tester]){
                IsSeeIf = tester;
              }
            }
          }
          
          let thrower = function(target, prop, value){
            throw Doh.error('Watch caught "',prop,'" being',type,'to:',value,(IsSeeIf?('and it '+IsSeeIf):('which matches wated value: '+value_condition)),'on:',target);
          };
          
          callback = callback || thrower;
          
          let outer_callback = function(target, prop, value){
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
            
            originalObject.__handler__.setters[prop_name] = true;
            originalObject.__handler__.melded_set.meld_stack.push(outer_callback);
            
          } else {
            
            originalObject.__handler__.getters[prop_name] = true;
            originalObject.__handler__.melded_get.meld_stack.push(outer_callback);
            
          }
        }
      }

      // run the machine to the specified phase and return the object
      return object.machine(phase);
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
    WatchedPhases:{
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
        'key1':function(obj, prop, value){},
        'key2':function(obj, prop, value){},
      },
      'pattern8':{
        'key1':function(obj, prop, value){},
        'key2':function(obj, prop, value){},
      },
      */
    },
    WatchedKeyGetters:{
      /*
      'pattern1':{
        'key1':function(target, prop, receiver){},
        'key1':function(target, prop, receiver){},
      },
      'pattern4':{
        'key1':function(target, prop, receiver){},
        'key1':function(target, prop, receiver){},
      },
      */
    },
    
    /*
     *  Commands:
     *    RenameTo: move the value to a different key.
     */
    see_pattern_keys: function(idea){
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
                  Doh[command]('WatchedKeys:',pattern_prop,'wants to',command,':',command_value,idea);
                  break;
                case 'throw':
                  // throw an error so we can trace from here
                  throw Doh.error('WatchedKeys:',pattern_prop, 'wants to be thrown. It said:',command_value,idea);
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
    
    idealize: function(patterns, active) {
      let j, new_idea = {}, which_idea;
      // default to finding the original idea
      patterns = patterns || 'idea';
      // make sure that patterns is an array
      if(!Array.isArray(patterns)) patterns = [patterns];
      // for each filter idea
      for(let i=0; i<patterns.length; i++){
        which_idea = patterns[i];
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
            Patterns[which_idea].idealize.call(this, patterns, active, new_idea);
        }
      }
      return new_idea;
    },
    
    // show me properties/methods/both of a doh object filtered by [patterns]
    perspective: function(obj, patterns, methods = false){
      if(!obj) return false;
      let prop, new_idea = {}, which_idea, pattern_object, original_patterns = patterns;
      
      Doh.log('Doh.perspective() was sent patterns:',patterns,'and methods:',methods);
      // default to finding the original idea
      patterns = patterns || 'idea';
      if(patterns === 'idea'){
        pattern_object = obj.inherited.idea;
        /*
         * ideas can introduce patterns for inheritance in: .inherits, New('pattern_name', ...), and New(['pattern_1', 'pattern_2'], ...)
         * this is also the order of signifigance
         * so pattern_2 will be the last pattern inherited.
         */
         patterns = Doh.meld_into_objectobject(patterns, pattern_object.inherits, pattern_object.pattern);
      }
      Doh.log('Doh.perspective() is using',patterns,'to extend inherits.');
      // default to expanding the pattern, but skip core patterns, cause we never need those
      patterns = Doh.pattern_inherits_extended(patterns, true);
      Doh.log('Doh.perspective() found:',patterns);
      // for each filter idea
      for(let i=0; i<patterns.length; i++){
        which_idea = patterns[i];
        if(which_idea === 'idea'){
          pattern_object = obj.inherited.idea;
        } else {
          pattern_object = Patterns[which_idea];
        }
        prop = '';
        // loop over the pattern or idea and use it to add properties to new_idea
        for(prop in pattern_object){
          //if(which_idea !== 'object' /*|| i != 'html'*/){
            if(!methods){
              if(typeof obj[prop] !== 'function'){
                new_idea[prop] = obj[prop];
              }
            } else {
              if(methods === 'both'){
                new_idea[prop] = obj[prop];
              } else if(typeof obj[prop] === 'function'){
                new_idea[prop] = obj[prop];
              }
            }
          //}
        }
        // if it's a pattern or the idea that has a function for it's "perspective" state, then run it
        if(pattern_object)
          if(typeof pattern_object.perspective === 'function'){
            pattern_object.perspective.call(this, obj, patterns, methods, which_idea, pattern_object, new_idea);
          }
      }
      return new_idea;
    },

    // args.exclude_methods, args.truncate_methods, args.exclude_children
    idea_to_yaml: function(idea, args){
      var ic = this.idea_to_ideacode(idea, args);
      return jsyaml.load(ic);
    },

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

    ideacode_to_source: function(ideacode){
      return 'New(' + ideacode + ');\n';
    },
    
    meld_method_order: function(object, method){
      var meld_method_order = [], pre_meld_method_order = [];
      for(var i in object.inherited){
        if(object.inherited[i]['pre_'+method]) pre_meld_method_order.push(i+'.pre_'+method);
        if(object.inherited[i][method]) meld_method_order.push(i+'.'+method);
      }
      return pre_meld_method_order.concat(meld_method_order);
    },
    
    phases_method_order: function(object){
      var phases_method_order = [];
      for(var melded_prop in object.melded){
        if(object.melded[melded_prop] === 'phase'){
          phases_method_order.push(Doh.meld_method_order(object, melded_prop));
        }
      }
      return phases_method_order;
    },
    
    meld_methods_order: function(object){
      var methods_order = [], counter = 0, phase_methods = 0;
      
      for(var melded_prop in object.melded){
        if(object.melded[melded_prop] === 'method' || object.melded[melded_prop] === 'phase'){
          methods_order.push(Doh.meld_method_order(object, melded_prop));
          counter += methods_order[methods_order.length-1].length
        }
      }
      /*
      for(let i in object.phases){
        methods_order.push(Doh.meld_method_order(object, object.phases[i]));
        counter += methods_order[methods_order.length-1].length
      }
      phase_methods = counter;
      Doh.log('has:', phase_methods, ' phase methods.');
      for(let i in object.meld_methods){
        methods_order.push(Doh.meld_method_order(object, object.meld_methods[i]));
        counter += methods_order[methods_order.length-1].length
      }
      Doh.log('and:', counter - phase_methods, ' melded methods.');
      */
      return methods_order;
    },
    
    log_melded_method: function(object, method){
      var method_array = Doh.meld_method_order(object, method);
      for (i in method_array){
        Doh.log(method_array[i],object.inherited[method_array[i].split('.')[0]][method].toString());
      }
    },
    
    link_melded_method: function(object, method){
      var method_array = Doh.meld_method_order(object, method);
      for (i in method_array){
        Doh.log(method_array[i],object.inherited[method_array[i].split('.')[0]][method]);
      }
    }
    
  });
  /* **** Doh Object Ready **** */
  Patterns = Doh.Patterns;
  Pattern = Doh.pattern;
  New = Doh.New;
  InstanceOf = Doh.InstanceOf = function(object, type){
    type = type || 'object';
    if(object)if(object.inherited)if(object.inherited[type]) return true;
    return false;
  }
  //Doh.Error = Doh.error;
  //Doh.Warn = Doh.warn;

  Pattern('idea');

  // set the prototype for the object constructor
  Pattern('object', {
    melded:{
      melded:'object',
      object_phase:'phase',
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
  });

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
// fix old melders
OnCoreLoaded(function(){
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

// fix old Doh. references that have moved
// NOTE: this usually stays off because we don't like it polluting Doh
OnCoreLoaded(function(){
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
  /*
  for(var test in SeeIf){
    rename_wrapper(test, 'SeeIf.'+test, SeeIf[test]);
  }
  rename_wrapper('isEmptyObject', 'SeeIf.IsEmptyObject', SeeIf.IsEmptyObject);
  rename_wrapper('isSet', 'SeeIf.IsSet', SeeIf.IsSet);
  rename_wrapper('inArray', 'Doh.in_array', Doh.in_array);
  rename_wrapper('Warn', 'Doh.warn', Doh.warn);
  rename_wrapper('Error', 'Doh.error', Doh.error);
  rename_wrapper('ExtendInherits', 'Doh.extend_inherits', Doh.extend_inherits);
  */
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
OnCoreLoaded(function(){
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
      var obj = e;
      if( typeof e == 'string' ) {
        // if it's a string, then it's a jquery selector
        obj = Doh.jQuery(e);
      }
      if( obj instanceof Doh.jQuery ) {
        // if it's a jquery object, find the dobj that built it
        if( obj[0] ){
          if( obj[0].dobj ) obj = obj[0].dobj;
          // or make a new one for it
          // TO ANDY: I don't think we use this and I don't really like it.
          // test raising warning
          else obj = New({pattern:'element', e:obj, parent:obj.parent()}, 'parenting_phase');
        }
        // the jQuery selector object is empty, we didn't find an actual element
        else obj = false;
      }
      if(!InstanceOf(obj)){
        Doh.warn('Doh.get_dobj could not find a doh object with:', e);
      }
      // in any case, at least return e
      return obj || e;
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
          Doh.warn('hierarchy control: ', this, ' could not find a controller. Use the parent: ', this.parent, 'instead.');
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
      
      if(Doh.DebugMode){
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
      // we use floor here because a pixel shy is almost always better than a pixel over
      //this.size.w2 = Math.floor(this.size.w/2);
      //this.size.h2 = Math.floor(this.size.h/2);
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
          left:o.left
        }
      };
      return this.box;
    },
  });

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

  Pattern('checkbox2', ['input', 'input_value'], {
    attrs: {type: 'checkbox'},
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
      this.dialog_options = Doh.meld_objects(this.dialog_options,{
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
