using NSubstitute;
using Xunit;

namespace Datalist.Tests.Unit
{
    public class MvcDatalistTests
    {
        #region Constants

        [Fact]
        public void Prefix_IsConstant()
        {
            Assert.True(typeof(MvcDatalist).GetField("Prefix").IsLiteral);
            Assert.Equal("Datalist", MvcDatalist.Prefix);
        }

        [Fact]
        public void IdKey_IsConstant()
        {
            Assert.True(typeof(MvcDatalist).GetField("IdKey").IsLiteral);
            Assert.Equal("DatalistIdKey", MvcDatalist.IdKey);
        }

        [Fact]
        public void AcKey_IsConstant()
        {
            Assert.True(typeof(MvcDatalist).GetField("AcKey").IsLiteral);
            Assert.Equal("DatalistAcKey", MvcDatalist.AcKey);
        }

        #endregion

        #region MvcDatalist()

        [Fact]
        public void MvcDatalist_Defaults()
        {
            MvcDatalist actual = Substitute.For<MvcDatalist>();

            Assert.Equal("DatalistDialog", actual.Dialog);
            Assert.Empty(actual.AdditionalFilters);
            Assert.Equal(20, actual.Filter.Rows);
            Assert.Empty(actual.Columns);
        }

        #endregion
    }
}
