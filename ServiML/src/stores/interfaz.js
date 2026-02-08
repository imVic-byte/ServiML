import {defineStore} from 'pinia'
export const useInterfaz = defineStore('ui',{
    state: () => ({
        isLoading: false
    }),
    actions:{
        showLoading() {
            this.isLoading=true
        },
        hideLoading() {
            this.isLoading=false
        }
    }
})