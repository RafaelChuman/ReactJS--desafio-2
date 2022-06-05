import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const copyCart = [...cart];
      const productExists = copyCart.find(product => product.id === productId)

      if (productExists)
      {
        const stock = await api.get(`/stock/${productId}`)
        const amount = productExists.amount + 1
        if(amount > stock.data.amount)
        {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        else{
          productExists.amount++;
        }
      }
      else
      {
        const response = await api.get<Product>(`/products/${productId}`);
        const newProduct = response.data;
        
        newProduct.amount = 1;

        copyCart.push(newProduct);
        
      }

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(copyCart));
      setCart(copyCart);
      
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const copyCart = [...cart];
      const product = copyCart.findIndex(product => product.id === productId );

      if(product === -1)
      {

        throw Error();

      }

      copyCart.splice(product, 1);
              
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(copyCart));
      
      setCart(copyCart);


    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({productId,amount}: UpdateProductAmount) => {
    try {
      
      if(amount <= 0 )
      {
        return;
      }
      const copyCart = [...cart];
      const product = copyCart.findIndex(product => product.id === productId)
      
      if(product === -1)
      {
        throw Error();
      } 

      const productStock = await api.get<Product>(`/stock/${productId}`)

      if(amount > productStock.data.amount)
      {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      else
      {
        copyCart[product].amount =  amount;
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyCart))
        setCart(copyCart)          
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
