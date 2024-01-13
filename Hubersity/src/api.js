import AsyncStorage from '@react-native-async-storage/async-storage';
import URL from './context/env';
import {log} from 'console';

export const fetchBarProducts = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    if (!storedToken) {
      console.error('Sem token');
      return [];
    }

    const response = await fetch(`${URL}/bar/produtos`, {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });
    const responseData = await response.json();

    return responseData;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchCart = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    if (!storedToken) {
      console.error('Sem token');
      return [];
    }

    const response = await fetch(`${URL}/bar/carrinho`, {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (response.status !== 200) {
      const status = response.status;
      return {status};
    }
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const removeFromCart = async id => {
  const storedToken = await AsyncStorage.getItem('token');
  try {
    if (!storedToken) {
      console.error('Sem token');
      return {success: false, message: 'Sem token'};
    }

    const response = await fetch(`${URL}/bar/carrinho/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (response.ok) {
      const responseData = await response.json();
      return {success: true, message: responseData.message};
    } else {
      const responseData = await response.json();
      console.error(responseData);
      return {success: false, message: responseData.message};
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Ocorreu um erro ao remover o produto do carrinho.',
    };
  }
};

export const addToCart = async id => {
  const storedToken = await AsyncStorage.getItem('token');
  try {
    if (!storedToken) {
      console.error('Sem token');
      return {success: false, message: 'Sem token'};
    }

    const response = await fetch(`${URL}/bar/carrinho/${id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (response.ok) {
      const responseData = await response.json();
      return {success: true, message: responseData.message};
    } else {
      const responseData = await response.json();
      console.error(responseData);
      return {success: false, message: responseData.message};
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Ocorreu um erro ao adicionar o produto ao carrinho.',
    };
  }
};

// pendingOrders
export const PendingOrders = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    if (!storedToken) {
      console.error('Sem token');
    }

    const response = await fetch(`${URL}/bar/pedidos`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (response.ok) {
      const responseData = await response.json();
      return responseData.pedidos;
    } else {
      const responseData = await response.json();
      console.error(responseData);
      return responseData;
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Ocorreu um erro a ver o pedidos por levantar.',
    };
  }
};

export const fetchUsers = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    if (!storedToken) {
      console.error('Sem token');
    }

    const response = await fetch(`${URL}/utilizadores`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (response.ok) {
      const responseData = await response.json();
      return responseData.utilizadores;
    } else {
      const responseData = await response.json();
      console.error(responseData);
      return responseData;
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Ocorreu um erro a ver o pedidos por levantar.',
    };
  }
};

export const deleteUser = async (id) => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    if (!storedToken) {
      console.error('Sem token');
    }

    const response = await fetch(`${URL}/utilizadores/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (response.ok) {
      const responseData = await response.json();
      return {success: true, message: responseData.message};
    } else {
      const responseData = await response.json();

      return responseData.message;
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Ocorreu um erro a ver o pedidos por levantar.',
    };
  }
};

export const changeCartQuantity = async (id, operacao) => {
  const storedToken = await AsyncStorage.getItem('token');
  try {
    if (!storedToken) {
      console.error('Sem token');
      return {success: false, message: 'Sem token'};
    }

    const response = await fetch(
      `${URL}/bar/carrinho/quantidade/${id}?operacao=${operacao}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      },
    );

    if (response.ok) {
      const responseData = await response.json();
      return {success: true, message: responseData.message};
    } else {
      const responseData = await response.json();
      console.error(responseData);
      return {success: false, message: responseData.message};
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Ocorreu um erro ao adicionar o produto ao carrinho.',
    };
  }
};

export const fetchEstacionamento = async id => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    if (!storedToken) {
      console.error('Sem token');
    }

    const response = await fetch(
      `${URL}/utilizadores/parqueestacionamento/${id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      },
    );

    if (response.ok) {
      const responseData = await response.json();
      return responseData;
    } else {
      const responseData = await response.json();
      console.error(responseData);
      return responseData;
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Ocorreu um erro a ver o pedidos por levantar.',
    };
  }
};


export const AddProdutosBar = async (nome, preco, categoria, descricao,Stock) => {
  const storedToken = await AsyncStorage.getItem('token');
  try {
    if (!storedToken) {
      console.error('Sem token');
      return {success: false, message: 'Sem token'};
    }

    const response = await fetch(`${URL}/bar/produtos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${storedToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Nome: nome,
        Preco: preco,
        Categoria: categoria,
        Descricao: descricao,
        Stock: Stock,

      }),
    });

    if (response.ok) {
      const responseData = await response.json();
      return {success: true, message: responseData.message};
    } else {
      const responseData = await response.json();
      console.error(responseData);
      return {success: false, message: responseData.message};
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Ocorreu um erro ao adicionar o produto ao carrinho.',
    };
  }
};