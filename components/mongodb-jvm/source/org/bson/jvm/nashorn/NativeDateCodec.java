/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.nashorn;

import org.bson.BsonReader;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;

import jdk.nashorn.internal.objects.NativeDate;

/**
 * A BSON codec for Nashorn's {@link NativeDate}.
 * 
 * @author Tal Liron
 */
public class NativeDateCodec implements Codec<NativeDate>
{
	//
	// Codec
	//

	public Class<NativeDate> getEncoderClass()
	{
		return NativeDate.class;
	}

	public void encode( BsonWriter writer, NativeDate nativeDate, EncoderContext encoderContext )
	{
		writer.writeDateTime( (long) NativeDate.getTime( nativeDate ) );
	}

	public NativeDate decode( BsonReader reader, DecoderContext decoderContext )
	{
		return (NativeDate) NativeDate.construct( true, null, reader.readDateTime() );
	}
}
