// this is for loading into a nodejs system
if(typeof global != 'undefined'){
  top = global;
  var Doh = top.Doh = {};
  var glob = top.glob = {};
  var SeeIf = top.SeeIf = {};
}

Doh = Doh || {};

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
    // undefined refers to objects that have not been defined anywhere in code yet
    'IsUndefined':(value) => `typeof ${value} === 'undefined'`,
    // null is supposed to refer to objects that have been defined, but have no value. In truth because of "falsey" values, it can have other meanings
    'IsNull':(value) => `${value} === null`,
    // defined is supposed to refer to having a usable reference. undefined means without reference. null references are still unusable in JS, so defined nulls should demand special handling
    'IsDefined':(value) => `(typeof ${value} !== 'undefined' && ${value} !== null)`,
    // false refers to the binary 0 state (Boolean)
    'IsFalse':(value) => `${value} === false`,
    // true refers to the binary 1 state (Boolean)
    'IsTrue':(value) => `${value} === true`,
    // falsey refers to values that equal binary 0, even if represented by a different datatype. Falsey values include: Undefined, Null, False, '', 0, -1...[negative numbers]
    'IsFalsey':(value) => `!${value}`,
    // truey referes to values that equal binary 1, even if represented by a different datatype. Truey values include: True, HasValue, 1...[positive numbers]
    'IsTruey':(value) => `${value} == true`,
    // boolean refers to values that are actual boolean datatype
    'IsBoolean':(value) => `typeof ${value} === 'boolean'`,
    // Number refers to values that are a number datatype EXCEPT NaN (Not a Number)
    'IsNumber':(value) => `(typeof ${value} === 'number' && !isNaN(${value}))`,
    // string refers to values that are actual string datatype
    'IsString':(value) => `typeof ${value} === 'string'`,
    // array refers to values that are actual array datatype
    'IsArray':(value) => `Array.isArray(${value})`,
    // iterable refers to values that define a Symbol iterator so that native methods can iterate over them
    'IsIterable':(value) => `((typeof ${value} !== 'undefined' && ${value} !== null) && typeof value[Symbol.iterator] === 'function')`,
    // arraylike refers to values that act like arrays in every way. they can be used by native array methods
    'IsArrayLike':(value) => `(((typeof ${value} !== 'undefined' && ${value} !== null) && typeof value[Symbol.iterator] === 'function') && typeof ${value}.length === 'number' && typeof ${value} !== 'string')`,
    // function refers to values that are actual functions
    'IsFunction':(value) => `typeof ${value} === 'function'`,
    // literal refers to values that are static literals. Strings, booleans, numbers, etc. Basically anything that isn't an object or array. flat values.
    'IsLiteral':(value) => `typeof ${value} !== 'object'`,
    // objectobject refers to values that are complex objects with named properties. No flat values or number-keyed lists. 
    'IsObjectObject':(value) => `(typeof ${value} === 'object' && toString.call(${value}) == '[object Object]')`,
    // to-be-replaced:
    // emptyobject refers to values that are objectobject or arraylike but have no properties of their own (empty of named properties that aren't javascript native)
    'IsEmptyObject':(value) => `${value}`,
    // dohobject refers to values that are a complex objectobject which was built with Doh
    'IsDohObject':(value) => `InstanceOf(${value})`,
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
    'NotNumber':(value) => `(typeof ${value} !== 'number' || isNaN(${value}))`,
    'NotString':(value) => `typeof ${value} !== 'string'`,
    'NotArray':(value) => `!Array.isArray(${value})`,
    'NotIterable':(value) => `!((typeof ${value} !== 'undefined' && ${value} !== null) && typeof value[Symbol.iterator] === 'function')`,
    'NotArrayLike':(value) => `!(((typeof ${value} !== 'undefined' && ${value} !== null) && typeof value[Symbol.iterator] === 'function') && typeof ${value}.length === 'number' && typeof ${value} !== 'string')`,
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
      logger = logger || console;
      var logger_args = [log_type];
      for(var i in args){
        if(i === 'length') continue;
        logger_args.push(args[i]);
      }
      logger[logger_method].apply(logger, logger_args);
    },
    log: function(){
      Doh._log(arguments, 'Doh:', 'log');
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
      if(SeeIf.NotObjectObject(inherits)) inherits = Doh.normalize_inherits({}, inherits);
      //if(skip_core) Doh.log('Doh.extend_inherits is skipping core.');
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
      //if(skip_core) console.groupEnd();
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
      //let mms = obj.meld_methods || [], melders = [...mms, ...obj.phases], len = melders.length;
      //for(let i=0;i<len;i++){
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

    TypeOf: {
      'method':SeeIf.IsFunction,
      'phase':SeeIf.IsFunction,
      'object':SeeIf.IsObjectObject,
      'array':SeeIf.IsArray,
      'idea':SeeIf.IsObjectObject
    },
    type_of: function(value){
      for(let type in Doh.TypeOf){
        if(Doh.TypeOf[type](value)){
          return type;
        }
      }
      return typeof value;
    },
    type_of_match: function(value, is){
      return Doh.TypeOf[is](value);
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
            if(!Doh.type_of_match(destination[prop_name], idea.melded[prop_name])){
              throw Doh.error('Doh.meld_ideas(',destination,',',idea,'). destination[',prop_name,']:',destination[prop_name],'is an incompatible type with idea.melded[',prop_name,']:',idea.melded[prop_name]);
            }
          }
          // deal with idea has a property of type that is incompatible with idea.melded type
          if(SeeIf.IsDefined(idea[prop_name])){
            if(!Doh.type_of_match(idea[prop_name], idea.melded[prop_name])){
              throw Doh.error('Doh.meld_ideas(',destination,',',idea,'). idea[',prop_name,']:',idea[prop_name],'is an incompatible type with idea.melded[',prop_name,']:',idea.melded[prop_name]);
            }
          }
        }
      }
      prop_name = '';
      for(prop_name in destination.melded){
        // deal with idea has a property of type that is incompatible with destination melded type
        if(SeeIf.IsDefined(idea[prop_name]))if(destination.melded[prop_name])if(!Doh.type_of_match(idea[prop_name], destination.melded[prop_name])){
          throw Doh.error('Doh.meld_ideas(',destination,',',idea,'). idea[',prop_name,']:',idea[prop_name],'is an incompatible type with destination.melded[',prop_name,']:',destination.melded[prop_name]);
        }
      }
      // build name-keyed objects of the melded value lists
      let melded = Doh.meld_objects(destination.melded, idea.melded);
      // loop over the idea and decide what to do with the properties
      prop_name = '';
      for(prop_name in idea){
        if(idea[prop_name] !== undefined){
          
          if(melded[prop_name] === 'array' || (Array.isArray(idea[prop_name]) && !idea[prop_name].length)){
            // it's a melded array or an empty default
            destination[prop_name] = Doh.meld_arrays(destination[prop_name], idea[prop_name]);
            continue;
          }
          if(melded[prop_name] === 'object' || (typeof idea[prop_name] == 'object' && !Array.isArray(idea[prop_name]) && SeeIf.IsEmptyObject(idea[prop_name]))){
            // it's a melded object or an empty default
            destination[prop_name] = Doh.meld_objects(destination[prop_name], idea[prop_name]);
            continue;
          }
          if(melded[prop_name] === 'method' || melded[prop_name] === 'phase'){
            // we handle melded methods and phases later
            // we set to null to preserve property order
            destination[prop_name] = null;
            continue;
          }
          // stack the ifs for speed
          if(idea[prop_name].pattern)if(!idea[prop_name].machine)if(!idea[prop_name].skip_auto_build){
            // it's an auto-build property, auto-meld it
            destination.melded[prop_name] = melded[prop_name] = 'idea';
            //destination.meld_objects = Doh.meld_arrays(destination.meld_objects, [prop_name]);
            //continue;
          }
          if(melded[prop_name] === 'idea'){
            destination[prop_name] = destination[prop_name] || {};
            destination[prop_name] = Doh.meld_ideas(destination[prop_name], idea[prop_name]);
            continue;
          }
          // non-melded property
          if(!skip_methods){
            //if(typeof idea[prop_name] == 'object' && !Array.isArray(idea[prop_name])) Doh.log('non-melded, non-function:',prop_name,'in:',idea);
            destination[prop_name] = idea[prop_name];
            continue;
          } else if(typeof idea[prop_name] !== 'function'){
            destination[prop_name] = idea[prop_name];
          }
        }
      }

      // this section is only run after the origin idea was inherited
      if(destination.inherited)if(destination.machine){
        // we update here so it only happens once
        // we only want to run this after the idea has been melded 
        // inherited is only present on instances, patterns don't have it
        // and neither do plain ideas
        if(!skip_methods) Doh.update_meld_methods(destination);
      }

      return destination;
    },
    
    /**
     *  @brief Normallize all the ways we can format inherits
     *
     *  @param [in] destination Object or Prototype to adjust .inherits on
     *  @param [in] inherits    String, Array, Array-like-object, or Object of
     *                          patterns to inherit from. (See details)
     *  @return destination
     *
     *  @details This method modifes 'destination'
     *
     * 'pattern_name_1'
     * ['pattern_name_1', 'pattern_name_2']
     * {0:'pattern_name_1', 1:'pattern_name_2'}
     * {'pattern_name_1':true, 'pattern_name_2':true}
     *
     * *RESULTS IN:* {'pattern_name_1':true, 'pattern_name_2':true}
     * *OR* {}
     **/
    normalize_inherits: function(destination, inherits){
      // allow inherits to be a string
      if (typeof inherits === 'string')
        destination[inherits] = true;
      // or an array-like object
      else if (typeof inherits !== 'undefined'){
        for(var i in inherits){
          if (i !== 'length'){
            // allow the array structure to have the pattern name in key
            if(isNaN(i)) destination[i] = true;
            // or in the value
            else destination[inherits[i]] = true;
          }
        }
      }
      return destination;
    },
    
    pattern_inherits_extended: function(pattern_name_or_inherits, skip_core = false){
      return Object.keys(Doh.extend_inherits(Doh.normalize_inherits({}, pattern_name_or_inherits), skip_core));
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
      if(typeof name !== 'string'){
        // the name is the idea
        // only allow this if the idea contains its own pattern name
        idea = name;
        if(typeof idea.pattern === 'string') name = idea.pattern;
        else throw Doh.error('Doh.pattern('+idea+') tried to make a pattern with no name');

        // inherits will be in the idea
        inherits = false;
      } else if (typeof inherits !== 'string' && !(inherits instanceof Array)) {
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
        Doh.warn('(',name,') pattern is being overwritten.\nOriginal Module:',Doh.PatternModule[name],'\nNew Module:',Doh.ModuleCurrentlyRunning);
      }

      // normalize passed in inherits
      if(inherits) inherits = Doh.normalize_inherits({}, inherits);
      // normalize the inherits of the pattern idea
      if(idea.inherits) idea.inherits = Doh.normalize_inherits({}, idea.inherits);
      // extend them onto a fresh object
      idea.inherits = Doh.meld_objects({}, inherits || {}, idea.inherits || {});
      // if there still aren't any inherits, at least inherit object
      if(name !== 'object')if(SeeIf.IsEmptyObject(idea.inherits)) idea.inherits.object = true;
      // now that we've normalized all the inherits, report our dependencies to each PatternInheritedBy
      for(var ancestor in idea.inherits){
        Doh.PatternInheritedBy[ancestor] = Doh.PatternInheritedBy[ancestor] || [];
        Doh.PatternInheritedBy[ancestor].push(name);
      }
      // we need to fix the .melded collection here:
      let meld_type_name, meld_type_js;
      for(var prop_name in idea.melded){
        meld_type_name = idea.melded[prop_name];
        if(SeeIf.IsDefined(idea[prop_name]))if(!Doh.type_of_match(idea[prop_name], meld_type_name)){
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
            throw Doh.error('Doh.pattern() tried to define unknown meld type:',meld_type_name,'for pattern:',idea.pattern,idea);
            break;
        }
        // default the property if needed. if we define the meld, we should at least implement it
        idea[prop_name] = idea[prop_name] || meld_type_js;
        /*
        if(old_meld_type){
          // fill the old meld system from the new one
          idea[old_meld_type] = Doh.meld_arrays(idea[old_meld_type], [prop_name], true);
        }
        */
      }
      
      // store the new pattern for the builder
      Patterns[name] = idea;
      // note the new pattern's load module, if present
      Doh.PatternModule[name] = Doh.ModuleCurrentlyRunning;
      Doh.ModulePatterns[Doh.ModuleCurrentlyRunning] = Doh.ModulePatterns[Doh.ModuleCurrentlyRunning] || [];
      Doh.ModulePatterns[Doh.ModuleCurrentlyRunning].push(name);
      
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
      if(typeof pattern == 'string'){
        // then everything is normal
        idea = idea || {};
        // overwrite the idea's pattern?
        // NOTE: we need a new way to deal with this.
        idea.pattern = pattern;

      // if the pattern is an array,
      } else if(Array.isArray(pattern)){
        // make sure idea is an object
        idea = idea || {};
        // normalize passed-in inherits
        idea.inherits = Doh.normalize_inherits({}, idea.inherits);
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
      phase = phase || 'final';
      // if the idea already has a machine, just run it to the specified or final phase
      if(idea.machine){
        idea.machine(phase);
        return idea;
      }
      
      //idea.pattern = something should be here, not above. 

      // normalize passed-in inherits
      // this should now contain all patterns defined in the many places that things can be added to objects
      if(idea.inherits) idea.inherits = Doh.normalize_inherits({}, idea.inherits);

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
          Doh.warn('Doh.New: '+ idea.pattern + 'tried to inherit from "', i, '" but it was not found, skipping it entirely.');
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

      // attach the object machine
      object.machine = function(phase){
        //let phase_name, len = this.phases.length;
        // go through the phases to the one specified, or the last
        //for(let i = 0; i < len; i++){
        for(let phase_name in this.melded){
          if(this.melded[phase_name] === 'phase'){
            // stash the phase name
            //phase_name = this.phases[i];
            // as long as the phase hasn't been run
            if(!this.machine[phase_name]){
              // update the phase we are on
              this.machine.phase = phase_name;
              // mark it as not run
              this.machine[phase_name] = false;
              // run the phase
              this[phase_name].apply(this);
              // mark it as run
              this.machine[phase_name] = true;
            }
            // if this is the phase we are building to, then exit here
            if(phase_name == phase) return this;
          }
        }
        // always return the object. New() relies on this.
        return this;
      };

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

      // run the machine to the specified phase and return the object
      return object.machine(phase);
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
         patterns = {};
         Doh.normalize_inherits(patterns, pattern_object.inherits);
         Doh.normalize_inherits(patterns, pattern_object.pattern);
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
  Doh.Error = Doh.error;
  Doh.Warn = Doh.warn;

  Pattern('idea');

  // set the prototype for the object constructor
  Pattern('object', {
    melded:{
      melded:'object',
      object_phase:'phase',
    },
    // ensure that we are the base object phase
    object_phase: function() {
      for(var prop in this) {
        if(prop === 'prototype' || prop === '__proto__') continue;
        if(this[prop])if(this[prop].pattern)if(!this[prop].machine)if(!this[prop].skip_auto_build){
          this.auto_built = this.auto_built || {};
          this[prop]._auto_built_by = this;
          this[prop] = New(this[prop], 'object_phase');
          this.auto_built[prop] = this[prop];
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
    //phases:['log_phase'],
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
      children:'array',
      // setup our phases for building children and controls
      parenting_phase:'phase',
    },
    /*
    meld_arrays: [
      'children'
    ],
    // setup our phases for building children and controls
    phases: [
      'parenting_phase',
    ],
    */
    // create a phase to build children
    parenting_phase: function(){
      // loop through the children and attempt to build them
      var i = '';
      for(var i in this.children) {
        if(i === 'length') continue;
        this.children[i] = New(Doh.meld_objects({parent:this}, this.children[i]), this.machine_children_to);
      }
      i = '';
      for(var i in this.auto_built) {
        this.children.push(New(Doh.meld_objects({parent:this}, this.auto_built[i]), this.machine_children_to));
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
    /*
    meld_objects: ['fab', 'fab_idea'],
    // add our own phase
    phases: [
      'fab_phase',
    ],
    */
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
