import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useStatusStore = defineStore('status', () => {
  const mask_method = ref({})
  
  function register_mask_method(method_name, method){
    mask_method[method_name] = method
  }
  function call_mask_method(method_name, ...args){
    const method = mask_method[method_name];
      if (method && typeof method === 'function') {
        return method(...args);
      } else {
        console.warn(`mask的方法 ${methodName} 不存在或不是函数`);
        return null;
      }
  }

  return { 
    register_mask_method,
    call_mask_method,
   }
})
