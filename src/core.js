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
    'LacksValue':(value) => `(typeof ${value} === 'undefined' || ${value} === null || ${value} === '')`
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
        if(proxy === true){
          // we need the proxy reference early, but late-binding the handlers should be fine
          originalObject.__handler__ = {};
          // we replace object here so that the rest of the system will use it in their closures
          object = new Proxy(originalObject, originalObject.__handler__);
        }
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
      if(proxy === true){
        //__handler__.has = function(target, key) {return key in target;};
        //__handler__.ownKeys = function(target) {return Reflect.ownKeys(target);};
        
        // use a fancy melded_method to apply our stack of methods to each set call
        originalObject.__handler__.melded_set = Doh.meld_method(originalObject, set_stack);
        originalObject.__handler__.set = function(target, prop, value){
          if(prop === '__original__') return target;
          if(setters[prop]){ 
            //throw Doh.error('setter stuff:',object,target,prop,value);
            // in here, the target is the 
            target.__handler__.melded_set(...arguments);
          }
          return Reflect.set(...arguments);
        };
        
        originalObject.__handler__.melded_get = Doh.meld_method(originalObject, get_stack);
        originalObject.__handler__.get = function(target, prop){
          if(prop === '__original__') return target;
          if(getters[prop]){ 
            //throw Doh.error('getter stuff:',object,target,prop,receiver);
            target.__handler__.melded_get(...arguments);
          }
          return Reflect.get(...arguments);
        };
        
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
