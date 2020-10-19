import Vue from 'https://cdn.jsdelivr.net/npm/vue@2.6.12/dist/vue.esm.browser.js'

Vue.component('loader', {
    template: `
        <div style="display: flex; justify-content: center; align-items: center; height: 200px;">
            <div class="spinner-grow" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    `
})

new Vue({
    el: '#app',
    data() {
        return {
            form: {
                phrase: '',
                vendorCode: ''
            },
            result: [],
            loading: false
        }
    },
    methods: {
      async getHtml() {
          this.result = [];
          this.loading = true;
          const {...formData} = this.form;
          const data = await request('/api/gethtml','POST', {...formData});
          this.result = data;
          this.loading = false;

      } 
    }
})

async function request(url, method = 'GET', data = null) {
    try {
        const headers = {};
        let body;

        if (data) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(data);
        }

        const response = await fetch(url, {
            method,
            headers,
            body
        });

        return await response.json();

    } catch (e) {
        console.log('error :', console.log('Error: ' + e));
    }
}