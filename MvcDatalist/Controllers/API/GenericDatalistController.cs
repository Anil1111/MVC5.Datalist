﻿using System.Web.Mvc;

namespace MvcDatalist.Controllers.API
{
    public class GenericDatalistController : Controller
    {
        #region Constants

        [HttpGet]
        public ActionResult Prefix()
        {
            return View();
        }

        [HttpGet]
        public ActionResult IdKey()
        {
            return View();
        }

        [HttpGet]
        public ActionResult AcKey()
        {
            return View();
        }

        #endregion

        #region Properties


        [HttpGet]
        public ActionResult Identifier()
        {
            return View();
        }

        [HttpGet]
        public ActionResult Columns()
        {
            return View();
        }

        [HttpGet]
        public ActionResult DialogTitle()
        {
            return View();
        }

        [HttpGet]
        public ActionResult DatalistUrl()
        {
            return View();
        }

        [HttpGet]
        public ActionResult AdditionalFilters()
        {
            return View();
        }

        [HttpGet]
        public ActionResult DefaultSortOrder()
        {
            return View();
        }

        [HttpGet]
        public ActionResult DefaultSortColumn()
        {
            return View();
        }

        #endregion

        #region Methods

        [HttpGet]
        public ActionResult GetData()
        {
            return View();
        }

        #endregion
    }
}
