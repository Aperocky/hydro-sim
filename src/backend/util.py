import numpy as np
from scipy.stats import multivariate_normal


def meshgrid_normal(size, min_feature_size=0.1, max_feature_size=1.9):
    # Create a meshgrid of size
    x = np.linspace(0, size-1, size)
    y = x.copy()
    xx, yy = np.meshgrid(x, y)
    pos = np.empty(xx.shape + (2,))
    pos[:, :, 0] = xx
    pos[:, :, 1] = yy

    # Create the multi_variate distribution randomly
    mu = np.random.randint(size, size=2)
    sigma_size_pre = np.random.uniform(size*0.3, size**1.5)
    sigma_size_top, sigma_size_bot = np.random.uniform(min_feature_size, max_feature_size, size=2)*sigma_size_pre
    cov_max = np.sqrt(sigma_size_top * sigma_size_bot) * 0.8
    sigma_cov = np.random.uniform(-cov_max, cov_max)
    sigma = np.array([[sigma_size_top, sigma_cov],[sigma_cov, sigma_size_bot]])
    dist = multivariate_normal(mu, sigma)

    # Map the multivariate distribution to 2d array
    rel_heights = dist.pdf(pos)
    rel_heights /= rel_heights.max()
    return rel_heights


def meshgrid_combine(size=100, reps = 100, adjust = 1, min_feature_size=0.1):
    master = np.zeros((size, size))
    for _ in range(reps):
        grid = meshgrid_normal(size, min_feature_size=min_feature_size)
        grid *= np.random.uniform(-1,1)
        master += grid
    master += adjust
    return master
