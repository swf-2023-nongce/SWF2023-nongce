import torch
import librosa
from sklearn.decomposition import PCA
from sklearn.preprocessing import MinMaxScaler
import numpy as np


def calculate_matmul_n_times(n_components, mat_a, mat_b):
    """
    Calculate matrix product of two matrics with mat_a[0] >= mat_b[0].
    Bypasses torch.matmul to reduce memory footprint.
    args:
        mat_a:      torch.Tensor (n, k, 1, d)
        mat_b:      torch.Tensor (1, k, d, d)
    """
    res = torch.zeros(mat_a.shape).to(mat_a.device)

    for i in range(n_components):
        mat_a_i = mat_a[:, i, :, :].squeeze(-2)
        mat_b_i = mat_b[0, i, :, :].squeeze()
        res[:, i, :, :] = mat_a_i.mm(mat_b_i).unsqueeze(1)
    return res


def calculate_matmul(mat_a, mat_b):
    """
    Calculate matrix product of two matrics with mat_a[0] >= mat_b[0].
    Bypasses torch.matmul to reduce memory footprint.
    args:
        mat_a:      torch.Tensor (n, k, 1, d)
        mat_b:      torch.Tensor (n, k, d, 1)
    """
    assert mat_a.shape[-2] == 1 and mat_b.shape[-1] == 1
    return torch.sum(mat_a.squeeze(-2) * mat_b.squeeze(-1), dim=2, keepdim=True)


def get_pca(features, n_components=8):
    pca = PCA(n_components=n_components)
    transformed = pca.fit(features).transform(features)
    scaler = MinMaxScaler()
    scaler.fit(transformed)
    return scaler.transform(transformed)


sr = 48000


def get_mfcc_features(data, dim=8):
    """Get mfcc features and reduce by dtw"""
    mfcc_feat = librosa.feature.mfcc(y=data, sr=sr, n_mfcc=13, n_fft=2048)
    reduced_feat = get_pca(mfcc_feat, n_components=dim)
    return np.mean(reduced_feat, axis=0)


def read_wav(wav_file):
    data, _ = librosa.load(wav_file, sr=sr)
    trimmed_data, _ = librosa.effects.trim(y=data)
    return trimmed_data
