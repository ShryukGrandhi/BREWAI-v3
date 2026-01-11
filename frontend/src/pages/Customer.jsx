import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { 
  ShoppingCart, Plus, Minus, Check, X, Star, Percent, Sparkles
} from 'lucide-react'
import config from '../config'

const API_BASE = config.api.baseUrl

export default function CustomerPage() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flashSale, setFlashSale] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [orderInProgress, setOrderInProgress] = useState(false)

  useEffect(() => {
    fetchProducts()
    const interval = setInterval(fetchProducts, 3000)
    return () => clearInterval(interval)
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/store/products`)
      if (response.data.success) {
        setProducts(response.data.products || [])
        setFlashSale(response.data.flash_sale)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    const existing = cart.find(item => item.id === productId)
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item => 
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      ))
    } else {
      setCart(cart.filter(item => item.id !== productId))
    }
  }

  const getCartTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  const getCartCount = () => cart.reduce((count, item) => count + item.quantity, 0)

  const placeOrder = async () => {
    if (!customerName.trim()) { alert('Please enter your name'); return }
    setOrderInProgress(true)
    
    try {
      const response = await axios.post(`${API_BASE}/api/orders/create`, {
        customer_name: customerName,
        items: cart.map(item => ({ product_id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
        total: getCartTotal()
      })
      
      if (response.data.success) {
        setOrderPlaced(true)
        setCart([])
        setShowCart(false)
        setCustomerName('')
        setTimeout(() => setOrderPlaced(false), 4000)
      }
    } catch (error) {
      alert('Failed to place order')
    } finally {
      setOrderInProgress(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0a0a0f',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Sparkles size={48} style={{ color: '#06C167' }} />
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)',
      color: '#fff'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #06C167, #00a655)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem'
          }}>☕</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>Brew Cafe</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Fresh • Delicious • Fast</div>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCart(true)}
          style={{
            background: '#06C167', border: 'none', borderRadius: 12,
            padding: '12px 24px', color: '#fff', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            position: 'relative'
          }}
        >
          <ShoppingCart size={20} /> Cart
          {getCartCount() > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute', top: -8, right: -8,
                background: '#ef4444', borderRadius: '50%',
                width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700
              }}
            >{getCartCount()}</motion.span>
          )}
        </motion.button>
      </header>

      {/* Flash Sale Banner */}
      <AnimatePresence>
        {flashSale?.active && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: 'linear-gradient(90deg, #ef4444, #f97316)',
              padding: '12px 32px', textAlign: 'center',
              fontWeight: 700, fontSize: '1rem'
            }}
          >
            <Percent size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            FLASH SALE: {flashSale.discount}% OFF {flashSale.category?.toUpperCase() || 'DRINKS'}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section style={{ padding: '48px 32px', textAlign: 'center' }}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            fontSize: '2.5rem', fontWeight: 800, marginBottom: 12,
            background: 'linear-gradient(135deg, #fff 0%, #06C167 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}
        >Order Online</motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 400, margin: '0 auto' }}
        >Fresh coffee, delicious food. Order now for pickup.</motion.p>
      </section>

      {/* Products */}
      <section style={{ padding: '0 32px 64px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20
        }}>
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div style={{
                height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3.5rem', position: 'relative',
                background: product.category === 'beverages' 
                  ? 'linear-gradient(135deg, rgba(6,193,103,0.15) 0%, rgba(6,193,103,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(249,115,22,0.05) 100%)'
              }}>
                {product.image || (product.category === 'beverages' ? '☕' : '🍔')}
                {product.featured && (
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: '#f59e0b', color: '#000',
                    padding: '3px 8px', borderRadius: 16,
                    fontSize: '0.65rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 3
                  }}><Star size={10} fill="currentColor" /> FEATURED</div>
                )}
                {product.sale && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: '#ef4444', color: '#fff',
                    padding: '3px 10px', borderRadius: 16,
                    fontSize: '0.7rem', fontWeight: 700
                  }}>-{product.discount}%</div>
                )}
              </div>
              
              <div style={{ padding: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{product.name}</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: 12 }}>
                  {product.description || 'Freshly made with care'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {product.sale ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                          ${product.originalPrice?.toFixed(2)}
                        </span>
                        <span style={{ fontWeight: 700, color: '#06C167', fontSize: '1.2rem' }}>
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>${product.price.toFixed(2)}</span>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(product)}
                    style={{
                      background: '#06C167', border: 'none', borderRadius: 10,
                      padding: '10px 16px', color: '#fff', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                    }}
                  ><Plus size={16} /> Add</motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {products.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' }}>
            <Sparkles size={48} style={{ opacity: 0.4, marginBottom: 16 }} />
            <p>No products available</p>
          </div>
        )}
      </section>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
                background: '#111118', zIndex: 201, padding: 24,
                display: 'flex', flexDirection: 'column',
                borderLeft: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Your Cart</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setShowCart(false)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, color: '#fff', cursor: 'pointer' }}
                ><X size={20} /></motion.button>
              </div>

              {cart.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  <ShoppingCart size={48} style={{ opacity: 0.4, marginBottom: 16 }} />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {cart.map((item) => (
                      <motion.div key={item.id} layout style={{
                        background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                        padding: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14
                      }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 10,
                          background: 'rgba(6,193,103,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.4rem'
                        }}>{item.category === 'beverages' ? '☕' : '🍔'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                          <div style={{ color: '#06C167', fontWeight: 700 }}>${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 8px' }}>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeFromCart(item.id)}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
                          ><Minus size={14} /></motion.button>
                          <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => addToCart(item)}
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
                          ><Plus size={14} /></motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, marginTop: 20 }}>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{
                        width: '100%', padding: '14px 16px', borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff', fontSize: '1rem', marginBottom: 14
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: '1.1rem' }}>
                      <span>Total:</span>
                      <span style={{ fontWeight: 700, color: '#06C167' }}>${getCartTotal().toFixed(2)}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={placeOrder}
                      disabled={orderInProgress}
                      style={{
                        width: '100%', background: orderInProgress ? 'rgba(255,255,255,0.2)' : '#06C167',
                        border: 'none', borderRadius: 12, padding: '16px',
                        color: '#fff', fontWeight: 700, fontSize: '1rem',
                        cursor: orderInProgress ? 'not-allowed' : 'pointer'
                      }}
                    >{orderInProgress ? 'Placing Order...' : 'Place Order'}</motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {orderPlaced && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              background: '#06C167', padding: '16px 32px', borderRadius: 16,
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 10px 40px rgba(6,193,103,0.4)', zIndex: 300
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><Check size={20} /></div>
            <div>
              <div style={{ fontWeight: 700 }}>Order Placed!</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Being prepared now</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
