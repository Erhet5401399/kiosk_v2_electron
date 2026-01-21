class ApiService {
  static async fetchData(): Promise<any> {
    console.log("ApiService: fetching data");
    const res = await fetch("https://jsonplaceholder.typicode.com/todos/1");
    return await res.json();
  }
}

export default ApiService;