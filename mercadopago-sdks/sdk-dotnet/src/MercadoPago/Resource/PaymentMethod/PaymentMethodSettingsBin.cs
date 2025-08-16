﻿namespace MercadoPago.Resource.PaymentMethod
{
    /// <summary>
    /// Bin settings.
    /// </summary>
    public class PaymentMethodSettingsBin
    {
        /// <summary>
        /// Regular expression representing the accepted bins.
        /// </summary>
        public string Pattern { get; set; }

        /// <summary>
        /// Regular expression representing the excluded bins.
        /// </summary>
        public string ExclusionPattern { get; set; }

        /// <summary>
        /// Regular expression representing bins allowed to pay with more
        /// than one installment.
        /// </summary>
        public string InstallmentsPattern { get; set; }
    }
}
